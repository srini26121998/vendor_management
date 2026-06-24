import { create } from 'zustand';
import { 
    createDockAppointment, 
    fetchDockAppointments, 
    gateCheckinAppointment, 
    submitGRNReceiving,
    recordIotTelemetry 
} from '../api/vendorService';

const useInboundStore = create((set, get) => ({
    appointments: [], 
    gateLogs: [], 
    receivingLogs: [], 

    fetchAppointments: async () => {
        try {
            const res = await fetchDockAppointments();
            if (res && Array.isArray(res)) {
                set({ appointments: res });
            }
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
        }
    },

    bookSlot: async (appointmentData) => {
        try {
            const res = await createDockAppointment(appointmentData);
            if (res && res.id) {
                set((state) => ({ appointments: [...state.appointments, res] }));
                return res.id;
            }
        } catch (error) {
            console.error("Failed to book slot:", error);
            return null;
        }
    },

    updateAppointmentStatus: (id, status, extra = {}) => {
        set((state) => ({
            appointments: state.appointments.map(a => a.id === id ? { ...a, status, ...extra } : a)
        }));
    },
    
    confirmAppointment: async (id) => {
        try {
            await gateCheckinAppointment(id, "CONFIRM");
            get().updateAppointmentStatus(id, 'Confirmed');
        } catch (error) {
            console.error("Failed to confirm:", error);
        }
    },
    
    cancelAppointment: async (id) => {
        try {
            await gateCheckinAppointment(id, "CANCEL");
            get().updateAppointmentStatus(id, 'Cancelled');
        } catch (error) {
            console.error("Failed to cancel:", error);
        }
    },

    rescheduleAppointment: (id, newDate, newSlot) => {
        set((state) => ({
            appointments: state.appointments.map(a => 
                a.id === id ? { ...a, date: newDate, slot: newSlot, status: 'Pending' } : a
            )
        }));
    },

    logGateEntry: async (appointmentId) => {
        try {
            const res = await gateCheckinAppointment(appointmentId, "APPROVE");
            set((state) => ({
                gateLogs: [...state.gateLogs, { appointmentId, entryTime: new Date().toISOString(), status: 'Entered' }]
            }));
            if(res && res.status) {
                get().updateAppointmentStatus(appointmentId, res.status);
            } else {
                get().updateAppointmentStatus(appointmentId, 'CHECKED_IN');
            }
        } catch (error) {
            console.error("Gate Entry failed:", error);
            get().updateAppointmentStatus(appointmentId, 'Arrived'); // fallback
        }
    },

    logGateExit: (appointmentId) => {
        set((state) => ({
            gateLogs: state.gateLogs.map(g => g.appointmentId === appointmentId ? { ...g, exitTime: new Date().toISOString(), status: 'Exited' } : g)
        }));
        get().updateAppointmentStatus(appointmentId, 'Completed');
    },

    saveReceivingLog: async (poNumber, appointmentId, itemsScanned, status) => {
        // Transform the frontend state format to the Backend GRN Format
        const payload = {
            poNumber: poNumber,
            vendorId: "VND-1234", // Dummy vendor ID since UI doesn't supply it yet
            receivedBy: "Warehouse Supervisor",
            receiptDate: new Date().toISOString(),
            lineItems: itemsScanned.map(item => ({
                productId: item.id || item.productName || "UNK",
                productName: item.name || item.productName || "Unknown",
                expectedQty: item.expected || 0,
                scannedQty: item.scanned || 0,
                isDamaged: item.damaged > 0,
                isRejected: item.rejected > 0
            }))
        };

        try {
            const res = await submitGRNReceiving(payload);
            set((state) => ({
                receivingLogs: [...state.receivingLogs, { poNumber, appointmentId, itemsScanned, status: res.status, timestamp: new Date().toISOString() }]
            }));
            if (appointmentId) {
                get().updateAppointmentStatus(appointmentId, 'Received');
            }
        } catch (error) {
            console.error("Failed to submit GRN", error);
            // Fallback for UI if backend is offline
            set((state) => ({
                receivingLogs: [...state.receivingLogs, { poNumber, appointmentId, itemsScanned, status, timestamp: new Date().toISOString() }]
            }));
            if (appointmentId) {
                get().updateAppointmentStatus(appointmentId, 'Received');
            }
        }
    },
    
    rejectAppointment: async (id, reason) => {
        try {
            const res = await gateCheckinAppointment(id, "DENY");
            if(res && res.status) {
                get().updateAppointmentStatus(id, res.status, { rejectionReason: reason });
            } else {
                get().updateAppointmentStatus(id, 'GATE_DENY', { rejectionReason: reason });
            }
        } catch (error) {
            console.error("Gate Deny failed:", error);
            get().updateAppointmentStatus(id, 'Rejected', { rejectionReason: reason });
        }
    },

    logIotTelemetry: async (telemetryData) => {
        try {
            await recordIotTelemetry(telemetryData);
        } catch (error) {
            console.error("Failed to log telemetry:", error);
        }
    }
}));

export default useInboundStore;
