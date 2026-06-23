import { create } from 'zustand';

const useInboundStore = create((set, get) => ({
    appointments: [], // { id, poNumbers, store, date, slot, vehicleType, vehicleReg, driverName, driverMobile, status: 'Scheduled' | 'Arrived' | 'Received' | 'Completed' | 'Rejected', rejectionReason }
    gateLogs: [], // { appointmentId, entryTime, exitTime, status: 'Entered' | 'Exited' }
    receivingLogs: [], // { poNumber, appointmentId, itemsScanned: [], status: 'Matched' | 'Discrepancy' }

    bookSlot: (appointmentData) => {
        const id = `DA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        // Vendor submission initially goes to Pending
        const newAppt = { ...appointmentData, id, status: 'Pending' };
        set((state) => ({ appointments: [...state.appointments, newAppt] }));
        return id;
    },

    updateAppointmentStatus: (id, status, extra = {}) => {
        set((state) => ({
            appointments: state.appointments.map(a => a.id === id ? { ...a, status, ...extra } : a)
        }));
    },
    
    confirmAppointment: (id) => {
        get().updateAppointmentStatus(id, 'Confirmed');
    },
    
    cancelAppointment: (id) => {
        get().updateAppointmentStatus(id, 'Cancelled');
    },

    rescheduleAppointment: (id, newDate, newSlot) => {
        set((state) => ({
            appointments: state.appointments.map(a => 
                a.id === id ? { ...a, date: newDate, slot: newSlot, status: 'Pending' } : a
            )
        }));
    },

    logGateEntry: (appointmentId) => {
        set((state) => ({
            gateLogs: [...state.gateLogs, { appointmentId, entryTime: new Date().toISOString(), status: 'Entered' }]
        }));
        get().updateAppointmentStatus(appointmentId, 'Arrived');
    },

    logGateExit: (appointmentId) => {
        set((state) => ({
            gateLogs: state.gateLogs.map(g => g.appointmentId === appointmentId ? { ...g, exitTime: new Date().toISOString(), status: 'Exited' } : g)
        }));
        get().updateAppointmentStatus(appointmentId, 'Completed');
    },

    saveReceivingLog: (poNumber, appointmentId, itemsScanned, status) => {
        set((state) => ({
            receivingLogs: [...state.receivingLogs, { poNumber, appointmentId, itemsScanned, status, timestamp: new Date().toISOString() }]
        }));
        if (appointmentId) {
            get().updateAppointmentStatus(appointmentId, 'Received');
        }
    },
    
    rejectAppointment: (id, reason) => {
        get().updateAppointmentStatus(id, 'Rejected', { rejectionReason: reason });
    }
}));

export default useInboundStore;
