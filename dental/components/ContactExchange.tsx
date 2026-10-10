'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDownToLine, Contact, Share2, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type Settings = Record<string, any>;
const escVCard = (value: any) => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

function downloadCommercialContact(settings: Settings) {
  const fullName = settings.name || 'Dental Project';
  const phone = settings.phone || '';
  const mobile = settings.whatsapp ? '+' + String(settings.whatsapp).replace(/\D/g, '') : phone;
  const website = settings.website ? (/^https?:\/\//i.test(settings.website) ? settings.website : 'https://' + settings.website) : '';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:' + escVCard(fullName),
    'N:' + escVCard(fullName) + ';;;;',
    settings.company ? 'ORG:' + escVCard(settings.company) : '',
    settings.role ? 'TITLE:' + escVCard(settings.role) : '',
    phone ? 'TEL;TYPE=WORK,VOICE:' + escVCard(phone) : '',
    mobile ? 'TEL;TYPE=CELL,VOICE:' + escVCard(mobile) : '',
    settings.email ? 'EMAIL;TYPE=INTERNET,WORK:' + escVCard(settings.email) : '',
    website ? 'URL:' + escVCard(website) : '',
    settings.location ? 'ADR;TYPE=WORK:;;;;' + escVCard(settings.location) + ';;' : '',
    'END:VCARD'
  ].filter(Boolean).join('\r\n');
  const url = URL.createObjectURL(new Blob([lines], { type: 'text/vcard;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = (String(fullName).trim().replace(/[^a-z0-9_-]+/gi, '-') || 'commercial-contact') + '.vcf';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function ContactExchange({ settings, compact = false }: { settings: Settings; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [clinic, setClinic] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setMessage('Please confirm that you agree to share these details with the commercial representative.');
      return;
    }
    const normalized = whatsapp.replace(/\D/g, '');
    if (normalized.length < 8) {
      setMessage('Please enter a valid WhatsApp number including the country code.');
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setMessage('Contact sharing is temporarily unavailable. Please try again later.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await sb.from('shared_contacts').insert({
      full_name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      whatsapp_normalized: normalized,
      clinic: clinic.trim() || null,
      consent: true
    });
    setBusy(false);
    if (error?.code === '23505') {
      setMessage('This WhatsApp number has already shared contact details. Your existing record was kept, so no duplicate was created.');
      return;
    }
    if (error) {
      setMessage('We could not save your details. Please try again in a moment.');
      return;
    }
    setSuccess(true);
    setMessage('Thank you! Your contact details have been shared successfully.');
  }

  return <section aria-label="Contact exchange" style={compact ? { background: 'transparent', padding: 0, border: 0, marginLeft: 'auto', flexShrink: 0 } : { background: '#f4f8f8', padding: '12px 20px', borderBottom: '1px solid #e0e9e9' }}>
    <div style={compact ? { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 } : { maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      {!compact && <div style={{ maxWidth: 540 }}>
        <div style={{ color: '#237f83', fontSize: 11, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase' }}>Stay connected</div>
        <h2 style={{ margin: '6px 0', color: '#153536', fontSize: 18 }}>Save the commercial contact</h2>
        <p style={{ margin: 0, color: '#586c6d', fontSize: 13, lineHeight: 1.45 }}>Save the representative’s details to your phone, or share your own contact details so they can follow up with you.</p>
      </div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 7 : 10 }}>
        <button type="button" onClick={() => downloadCommercialContact(settings)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 9, border: 0, borderRadius: 8, padding: compact ? '8px 10px' : '10px 14px', background: '#173c3d', color: '#fff', fontSize: compact ? 11 : 14, whiteSpace: 'nowrap', fontWeight: 700, cursor: 'pointer' }}><ArrowDownToLine size={compact ? 15 : 17}/> Save Contact</button>
        <button type="button" onClick={() => { setOpen(true); setMessage(''); setSuccess(false); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 9, border: '1px solid #258f93', borderRadius: 8, padding: compact ? '8px 10px' : '13px 17px', background: '#fff', color: '#176c70', fontSize: compact ? 11 : 14, whiteSpace: 'nowrap', fontWeight: 700, cursor: 'pointer' }}><Share2 size={compact ? 15 : 17}/> Share Contact</button>
      </div>
    </div>
    {open && <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,29,30,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-contact-title" style={{ width: '100%', maxWidth: 520, maxHeight: '95vh', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#258f93', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}><Contact size={15}/> Share your details</div><h2 id="share-contact-title" style={{ color: '#173c3d', margin: '8px 0', fontSize: 25 }}>Let’s stay in touch</h2><p style={{ color: '#5c6e6f', fontSize: 14, lineHeight: 1.5, marginTop: 0 }}>Fill in your details so {settings.name || 'the commercial representative'} can contact you.</p></div>
          <button type="button" aria-label="Close form" onClick={() => setOpen(false)} style={{ border: 0, background: '#f0f5f5', borderRadius: 8, padding: 8, cursor: 'pointer' }}><X size={18}/></button>
        </div>
        {success ? <div style={{ marginTop: 18, padding: 18, borderRadius: 10, background: '#edf8f1', color: '#21683d' }}><strong>{message}</strong><p style={{ fontSize: 14, marginBottom: 0 }}>You can now close this window. Your contact was saved for the commercial representative.</p><button type="button" onClick={() => setOpen(false)} style={{ marginTop: 14, border: 0, borderRadius: 7, background: '#21683d', color: '#fff', padding: '10px 15px', cursor: 'pointer' }}>Done</button></div> : <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 14 }}>
          <label style={{ display: 'grid', gap: 6, color: '#284748', fontSize: 13, fontWeight: 700 }}>Full name *<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={{ boxSizing: 'border-box', width: '100%', padding: 12, border: '1px solid #d6e1e1', borderRadius: 8, font: 'inherit', fontWeight: 400 }}/></label>
          <label style={{ display: 'grid', gap: 6, color: '#284748', fontSize: 13, fontWeight: 700 }}>Email address *<input required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ boxSizing: 'border-box', width: '100%', padding: 12, border: '1px solid #d6e1e1', borderRadius: 8, font: 'inherit', fontWeight: 400 }}/></label>
          <label style={{ display: 'grid', gap: 6, color: '#284748', fontSize: 13, fontWeight: 700 }}>WhatsApp number (include country code) *<input required type="tel" maxLength={32} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+212 6 XX XX XX XX" style={{ boxSizing: 'border-box', width: '100%', padding: 12, border: '1px solid #d6e1e1', borderRadius: 8, font: 'inherit', fontWeight: 400 }}/></label>
          <label style={{ display: 'grid', gap: 6, color: '#284748', fontSize: 13, fontWeight: 700 }}>Clinic / company (optional)<input maxLength={160} value={clinic} onChange={e => setClinic(e.target.value)} placeholder="Your clinic or company" style={{ boxSizing: 'border-box', width: '100%', padding: 12, border: '1px solid #d6e1e1', borderRadius: 8, font: 'inherit', fontWeight: 400 }}/></label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: '#5c6e6f', fontSize: 12, lineHeight: 1.5 }}><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3 }}/> I agree to share these details with the commercial representative so they can contact me about Dental Project products and services.</label>
          {message && <p role="alert" style={{ margin: 0, padding: 11, borderRadius: 8, background: '#fff4e5', color: '#874d0d', fontSize: 13 }}>{message}</p>}
          <button disabled={busy} type="submit" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, border: 0, borderRadius: 8, padding: 14, background: busy ? '#7a9999' : '#173c3d', color: '#fff', fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Saving your details…' : 'Share my contact details'}</button>
          <small style={{ color: '#738384', fontSize: 11, lineHeight: 1.5 }}>Your information is only submitted when you press the button above. Do not submit information you do not want to share.</small>
        </form>}
      </div>
    </div>}
  </section>;
}
