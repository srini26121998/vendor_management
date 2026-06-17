import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VENDOR_ROUTES } from './vendorConstants';
import { PrimaryBtn, SecondaryBtn, Stepper, VCard } from './VendorComponents';
import toast from 'react-hot-toast';
import useVendorStore from '../../store/useVendorStore';
import * as svc from '../../api/vendorService';

const BIZ  = ['MANUFACTURER','DISTRIBUTOR','TRADER','IMPORTER','SERVICE_PROVIDER'];
const GST  = ['REGULAR','COMPOSITION','SEZ','UNREGISTERED','EXPORT_ONLY'];
const TRN  = [{v:'LT_1CR',l:'< ₹1 Cr'},{v:'1_10CR',l:'₹1–10 Cr'},{v:'10_50CR',l:'₹10–50 Cr'},{v:'50_200CR',l:'₹50–200 Cr'},{v:'GT_200CR',l:'> ₹200 Cr'}];
const LOCS = ['FACTORY','WAREHOUSE','OFFICE','SHIPPING_POINT'];
const ACCT = ['CURRENT','SAVINGS','CC','OD'];
const STTS = ['AN','AP','AR','AS','BR','CG','CH','DL','GA','GJ','HR','HP','JK','JH','KA','KL','LA','MP','MH','MN','ML','MZ','NL','OD','PY','PB','RJ','SK','TN','TS','TR','UP','UK','WB'];
const DOCS = ['GSTIN','FSSAI','PAN','TRADE_LICENSE','DRUG_LICENSE','CIN','OTHER'];
const STEPS = [{label:'Vendor Info',icon:'🏢'},{label:'Location',icon:'📍'},{label:'Bank Account',icon:'🏦'},{label:'Documents',icon:'📄'}];

// exact same input class as VendorList.jsx filter inputs
const IC = (err) => `w-full px-4 h-11 bg-white border ${err?'border-rose-400 bg-rose-50/20':'border-slate-200'} rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm placeholder:text-slate-300`;
const SC = (err) => IC(err) + ' appearance-none cursor-pointer';
const LC = 'text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5';

const Field = ({label, error, req, children}) => (
  <div>
    <label className={LC}>{label}{req && <span className="text-rose-500 ml-1">*</span>}</label>
    {children}
    {error && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-wide">{error}</p>}
  </div>
);

const Inp = ({label,req,error,...p}) => <Field label={label} req={req} error={error}><input className={IC(error)} {...p}/></Field>;

const Sel = ({label,req,error,opts,ph,...p}) => (
  <Field label={label} req={req} error={error}>
    <div className="relative">
      <select className={SC(error)} {...p}>
        {ph && <option value="">{ph}</option>}
        {opts.map(o => typeof o==='string'
          ? <option key={o} value={o}>{o.replace(/_/g,' ')}</option>
          : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
      </span>
    </div>
  </Field>
);

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const {addVendor, saveVendor} = useVendorStore();
  const editData = location.state?.vendor;
  const isEdit = location.state?.mode === 'edit';
  const isView = location.state?.mode === 'view';

  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [vid, setVid]     = useState(editData?.id || null);
  const [errors, setErrors] = useState({});

  const [v, setV] = useState({
    legalName: editData?.name||editData?.legalName||'', tradeName: editData?.tradeName||'',
    businessType: editData?.businessType||'TRADER', gstin: editData?.gstin||'',
    panNumber: editData?.pan||editData?.panNumber||'', gstRegistrationType: editData?.gstRegistrationType||'REGULAR',
    primaryMobile: editData?.primaryMobile||editData?.phone||'', primaryEmail: editData?.primaryEmail||editData?.email||'',
    website: editData?.website||'', annualTurnoverRange: editData?.annualTurnoverRange||'',
    notes: editData?.notes||'', authRequired: editData?.authRequired??false,
  });
  const [loc, setLoc] = useState({locationType:'OFFICE',addressLine1:'',addressLine2:'',city:'',stateCode:'',pinCode:'',isPrimary:true});
  const [bank, setBank] = useState({accountHolderName:'',bankName:'',accountNumber:'',confirmAccountNumber:'',ifscCode:'',accountType:'CURRENT',isPrimary:true});
  const [docs, setDocs] = useState([{docType:'GSTIN',docNumber:'',expiryDate:'',fileReference:''},{docType:'PAN',docNumber:'',expiryDate:'',fileReference:''}]);

  const cv = (field, val) => setV(p=>({...p,[field]:val}));
  const cl = (field, val) => setLoc(p=>({...p,[field]:val}));
  const cb = (field, val) => setBank(p=>({...p,[field]:val}));
  const cd = (i, f, val) => setDocs(d=>d.map((r,idx)=>idx===i?{...r,[f]:val}:r));

  const validate = () => {
    const e = {};
    if(step===0){
      if(!v.legalName.trim()) e.legalName='Required';
      if(!v.businessType) e.businessType='Required';
      if(!v.primaryMobile.trim()) e.primaryMobile='Required';
      if(!v.primaryEmail.trim()) e.primaryEmail='Required';
      else if(!/\S+@\S+\.\S+/.test(v.primaryEmail)) e.primaryEmail='Invalid email';
      if(!v.panNumber.trim()) e.panNumber='Required';
      else if(!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.panNumber)) e.panNumber='Invalid PAN (e.g. ABCDE1234F)';
      if(v.gstin&&!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.gstin)) e.gstin='Invalid GSTIN';
      if(!v.gstRegistrationType) e.gstRegistrationType='Required';
    }
    if(step===1){
      if(!loc.locationType) e.locationType='Required';
      if(!loc.addressLine1.trim()) e.addressLine1='Required';
      if(!loc.city.trim()) e.city='Required';
      if(loc.pinCode&&!/^\d{6}$/.test(loc.pinCode)) e.pinCode='Must be 6 digits';
    }
    if(step===2){
      if(!bank.accountHolderName.trim()) e.accountHolderName='Required';
      if(!bank.bankName.trim()) e.bankName='Required';
      if(!bank.accountNumber.trim()) e.accountNumber='Required';
      else if(!/^\d{8,18}$/.test(bank.accountNumber)) e.accountNumber='Must be 8–18 digits';
      if(bank.confirmAccountNumber!==bank.accountNumber) e.confirmAccountNumber='Numbers do not match';
      if(!bank.ifscCode.trim()) e.ifscCode='Required';
      else if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode)) e.ifscCode='Invalid IFSC (e.g. HDFC0001234)';
      if(!bank.accountType) e.accountType='Required';
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleNext = async () => {
    if(!validate()){toast.error('Fix the errors before continuing.');return;}
    setSaving(true);
    try{
      if(step===0){
        const payload={legalName:v.legalName.trim(),tradeName:v.tradeName.trim()||null,businessType:v.businessType,
          gstin:v.gstin.trim()||null,panNumber:v.panNumber.trim(),gstRegistrationType:v.gstRegistrationType,
          primaryMobile:v.primaryMobile.trim(),primaryEmail:v.primaryEmail.trim(),website:v.website.trim()||null,
          annualTurnoverRange:v.annualTurnoverRange||null,notes:v.notes.trim()||null,authRequired:v.authRequired};
        if(isEdit){
          await toast.promise(saveVendor(editData.id,payload),{loading:'Updating...',success:'Vendor updated ✓',error:(e)=>e?.response?.data?.message||'Update failed'});
          setVid(editData.id);
        } else {
          const res = await toast.promise(addVendor(payload),{loading:'Creating vendor...',success:'Vendor created ✓',error:(e)=>e?.response?.data?.message||'Create failed'});
          setVid(res?.id||res?.data?.id);
        }
        setStep(1);
      } else if(step===1&&vid){
        await svc.addLocation(vid,{locationType:loc.locationType,addressLine1:loc.addressLine1.trim(),
          addressLine2:loc.addressLine2.trim()||null,city:loc.city.trim(),stateCode:loc.stateCode||null,
          pinCode:loc.pinCode||null,isPrimary:loc.isPrimary});
        toast.success('Location saved ✓');setStep(2);
      } else if(step===2&&vid){
        await svc.addBankAccount(vid,{accountHolderName:bank.accountHolderName.trim(),bankName:bank.bankName.trim(),
          accountNumber:bank.accountNumber.trim(),ifscCode:bank.ifscCode.trim().toUpperCase(),
          accountType:bank.accountType,isPrimary:bank.isPrimary});
        toast.success('Bank account saved ✓');setStep(3);
      }
    } catch(e){toast.error(e?.response?.data?.message||'Failed. Please try again.');}
    finally{setSaving(false);}
  };

  const handleFinish = async () => {
    const filled=docs.filter(d=>d.docNumber.trim());
    setSaving(true);
    try{
      if(filled.length>0&&vid) await Promise.all(filled.map(d=>svc.addDocument(vid,{docType:d.docType,docNumber:d.docNumber.trim(),expiryDate:d.expiryDate||null,fileReference:d.fileReference||null})));
      if(filled.length>0) toast.success('Documents saved ✓');
      navigate(VENDOR_ROUTES.list);
    } catch(e){toast.error(e?.response?.data?.message||'Some documents failed to save.');}
    finally{setSaving(false);}
  };

  return (
    <div className="w-full bg-[#F3F5F9] min-h-screen" style={{fontFamily:'"Inter", sans-serif'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}</style>

      {/* Header — same pattern as VendorList */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 pt-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={()=>navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-[22px] font-bold text-[#1e293b] tracking-tight">
                {isView?'View Vendor':isEdit?'Edit Vendor':'Onboard New Vendor'}
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Step {step+1} of {STEPS.length} — {STEPS[step].label}
              </p>
            </div>
          </div>
          <div className="w-full max-w-md">
            <Stepper steps={STEPS} current={step}/>
          </div>
        </div>

        {/* ── STEP 0 ── */}
        {step===0 && (
          <VCard>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">🏢 Vendor Information — <span className="text-blue-500">vendors</span> table</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Inp label="Legal Name" req error={errors.legalName} value={v.legalName} onChange={e=>cv('legalName',e.target.value)} disabled={isView} placeholder="Registered company name"/>
              <Inp label="Trade Name" error={errors.tradeName} value={v.tradeName} onChange={e=>cv('tradeName',e.target.value)} disabled={isView} placeholder="Brand / trading name (optional)"/>
              <Sel label="Business Type" req error={errors.businessType} value={v.businessType} opts={BIZ} onChange={e=>cv('businessType',e.target.value)} disabled={isView}/>
              <Sel label="Annual Turnover Range" value={v.annualTurnoverRange} opts={TRN} ph="— Select range —" onChange={e=>cv('annualTurnoverRange',e.target.value)} disabled={isView}/>
              <Inp label="Primary Mobile" req error={errors.primaryMobile} value={v.primaryMobile} onChange={e=>cv('primaryMobile',e.target.value)} disabled={isView} placeholder="+91 9876543210"/>
              <Inp label="Primary Email" req type="email" error={errors.primaryEmail} value={v.primaryEmail} onChange={e=>cv('primaryEmail',e.target.value)} disabled={isView} placeholder="contact@vendor.com"/>
              <Inp label="Website" error={errors.website} value={v.website} onChange={e=>cv('website',e.target.value)} disabled={isView} placeholder="https://vendor.com (optional)"/>
              <Sel label="GST Registration Type" req error={errors.gstRegistrationType} value={v.gstRegistrationType} opts={GST} onChange={e=>cv('gstRegistrationType',e.target.value)} disabled={isView}/>
              <Field label="GSTIN" error={errors.gstin}>
                <input className={IC(errors.gstin)} value={v.gstin} maxLength={15} placeholder="29ABCDE1234F1Z5 (optional)"
                  onChange={e=>cv('gstin',e.target.value.toUpperCase())} disabled={isView}/>
              </Field>
              <Field label="PAN Number" req error={errors.panNumber}>
                <input className={IC(errors.panNumber)} value={v.panNumber} maxLength={10} placeholder="ABCDE1234F"
                  onChange={e=>cv('panNumber',e.target.value.toUpperCase())} disabled={isView}/>
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea className={IC(false)+' h-20 py-3 resize-none'} value={v.notes}
                    onChange={e=>cv('notes',e.target.value)} disabled={isView} placeholder="Internal notes about this vendor (optional)"/>
                </Field>
              </div>
              <div className="md:col-span-2">
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${v.authRequired?'bg-amber-50 border-amber-200':'bg-[#F8FAFC] border-slate-200'}`}>
                  <button type="button" disabled={isView}
                    onClick={()=>!isView&&cv('authRequired',!v.authRequired)}
                    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 ${v.authRequired?'bg-amber-500':'bg-slate-300'} ${isView?'opacity-60':''}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${v.authRequired?'left-6':'left-1'}`}/>
                  </button>
                  <div>
                    <p className="text-[13px] font-bold text-slate-700">Require 4-step approval workflow</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{v.authRequired?'Category Manager → Quality → Finance → Director review before activation.':'Vendor activated immediately upon creation (recommended).'}</p>
                  </div>
                </div>
              </div>
            </div>
          </VCard>
        )}

        {/* ── STEP 1 ── */}
        {step===1 && (
          <VCard>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">📍 Primary Location — <span className="text-blue-500">vendor_locations</span> table</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Sel label="Location Type" req error={errors.locationType} value={loc.locationType} opts={LOCS} onChange={e=>cl('locationType',e.target.value)} disabled={isView}/>
              <div className="md:col-span-2"><Inp label="Address Line 1" req error={errors.addressLine1} value={loc.addressLine1} onChange={e=>cl('addressLine1',e.target.value)} disabled={isView} placeholder="Building / Street"/></div>
              <div className="md:col-span-2"><Inp label="Address Line 2" value={loc.addressLine2} onChange={e=>cl('addressLine2',e.target.value)} disabled={isView} placeholder="Area / Locality (optional)"/></div>
              <Inp label="City" req error={errors.city} value={loc.city} onChange={e=>cl('city',e.target.value)} disabled={isView} placeholder="City name"/>
              <Sel label="State" value={loc.stateCode} opts={STTS} ph="— Select State —" onChange={e=>cl('stateCode',e.target.value)} disabled={isView}/>
              <Field label="PIN Code" error={errors.pinCode}>
                <input className={IC(errors.pinCode)} value={loc.pinCode} maxLength={6} placeholder="6-digit PIN code"
                  onChange={e=>cl('pinCode',e.target.value.replace(/\D/,''))} disabled={isView}/>
              </Field>
              <div className="flex items-center gap-3 mt-1">
                <input type="checkbox" id="locPrimary" checked={loc.isPrimary} onChange={e=>cl('isPrimary',e.target.checked)} disabled={isView} className="w-4 h-4 rounded accent-blue-600"/>
                <label htmlFor="locPrimary" className="text-[13px] font-semibold text-slate-600">Mark as primary location</label>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">You can add more locations from the vendor detail page after creation.</p>
          </VCard>
        )}

        {/* ── STEP 2 ── */}
        {step===2 && (
          <VCard>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">🏦 Bank Account — <span className="text-blue-500">vendor_bank_accounts</span> table</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Inp label="Account Holder Name" req error={errors.accountHolderName} value={bank.accountHolderName} onChange={e=>cb('accountHolderName',e.target.value)} disabled={isView} placeholder="As per bank records"/>
              <Inp label="Bank Name" req error={errors.bankName} value={bank.bankName} onChange={e=>cb('bankName',e.target.value)} disabled={isView} placeholder="e.g. HDFC Bank"/>
              <Field label="Account Number" req error={errors.accountNumber}>
                <input type="password" className={IC(errors.accountNumber)} value={bank.accountNumber}
                  onChange={e=>cb('accountNumber',e.target.value)} disabled={isView} placeholder="8–18 digit account number"/>
              </Field>
              <Field label="Confirm Account Number" req error={errors.confirmAccountNumber}>
                <input className={IC(errors.confirmAccountNumber)} value={bank.confirmAccountNumber}
                  onPaste={e=>e.preventDefault()} onChange={e=>cb('confirmAccountNumber',e.target.value)} disabled={isView} placeholder="Re-enter account number"/>
              </Field>
              <Field label="IFSC Code" req error={errors.ifscCode}>
                <input className={IC(errors.ifscCode)} value={bank.ifscCode} maxLength={11} placeholder="HDFC0001234"
                  onChange={e=>cb('ifscCode',e.target.value.toUpperCase())} disabled={isView}/>
              </Field>
              <Sel label="Account Type" req error={errors.accountType} value={bank.accountType} opts={ACCT} onChange={e=>cb('accountType',e.target.value)} disabled={isView}/>
              <div className="flex items-center gap-3 mt-1">
                <input type="checkbox" id="bankPrimary" checked={bank.isPrimary} onChange={e=>cb('isPrimary',e.target.checked)} disabled={isView} className="w-4 h-4 rounded accent-blue-600"/>
                <label htmlFor="bankPrimary" className="text-[13px] font-semibold text-slate-600">Mark as primary bank account</label>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">You can add more bank accounts from the vendor detail page.</p>
          </VCard>
        )}

        {/* ── STEP 3 ── */}
        {step===3 && (
          <VCard>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">📄 Compliance Documents — <span className="text-blue-500">vendor_documents</span> table</p>
            <div className="space-y-3">
              {docs.map((doc,i)=>(
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-slate-100 relative">
                  <Sel label="Doc Type" req value={doc.docType} opts={DOCS} onChange={e=>cd(i,'docType',e.target.value)} disabled={isView}/>
                  <Field label="Document Number" req>
                    <input className={IC()} value={doc.docNumber} onChange={e=>cd(i,'docNumber',e.target.value)} disabled={isView} placeholder="Number / ID"/>
                  </Field>
                  <Field label="Expiry Date">
                    <input type="date" className={IC()} value={doc.expiryDate} onChange={e=>cd(i,'expiryDate',e.target.value)} disabled={isView}/>
                  </Field>
                  <Field label="File Reference">
                    <input className={IC()} value={doc.fileReference} onChange={e=>cd(i,'fileReference',e.target.value)} disabled={isView} placeholder="URL / path (optional)"/>
                  </Field>
                  {docs.length>1&&!isView&&(
                    <button onClick={()=>setDocs(d=>d.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 font-bold text-sm transition-colors">✕</button>
                  )}
                </div>
              ))}
              {!isView&&(
                <button onClick={()=>setDocs(d=>[...d,{docType:'OTHER',docNumber:'',expiryDate:'',fileReference:''}])}
                  className="flex items-center gap-2 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors px-1 py-2">
                  + Add another document
                </button>
              )}
            </div>
            <p className="mt-4 text-[11px] text-slate-400">Leave document number blank to skip that row. More documents can be added later from the vendor detail page.</p>
          </VCard>
        )}

        {/* ── Nav ── */}
        <div className="flex items-center justify-between pb-12">
          <SecondaryBtn onClick={()=>step===0?navigate(-1):setStep(s=>s-1)}>
            {step===0?'Cancel':'← Back'}
          </SecondaryBtn>
          <div className="flex items-center gap-3">
            {step<3?(
              <PrimaryBtn onClick={handleNext} disabled={saving||isView}>
                {saving?'Saving…':step===0&&!isEdit?'CREATE & CONTINUE →':'SAVE & CONTINUE →'}
              </PrimaryBtn>
            ):(
              <PrimaryBtn onClick={handleFinish} disabled={saving||isView}>
                {saving?'Saving…':'✓ FINISH'}
              </PrimaryBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
