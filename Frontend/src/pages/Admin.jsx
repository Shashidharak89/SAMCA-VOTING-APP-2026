import React, { useState, useEffect } from 'react';
import Analytics from '../components/Analytics';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const CANDIDATE_API = `${API_BASE}/candidate`;
const ADMIN_API = `${API_BASE}/admin`;

export default function Admin() {
  const [view, setView] = useState('settings'); // settings | registration | analytics
  const [message, setMessage] = useState('');
  const [votingWindow, setVotingWindow] = useState({ start: '', end: '' });
  const [savingWindow, setSavingWindow] = useState(false);
  const [registrationDueDate, setRegistrationDueDate] = useState('');
  const [savingDueDate, setSavingDueDate] = useState(false);
  const [candidates, setCandidates] = useState([]); // all statuses
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchAllCandidates = async () => {
    setLoadingCandidates(true);
    try {
  const res = await fetch(`${CANDIDATE_API}/all`);
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates);
      else setMessage(data.message || 'Error loading candidates');
    } catch (e) {
      setMessage('Network error loading candidates');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchVotingWindow = async () => {
  const res = await fetch(`${ADMIN_API}/get-voting-window`);
    if (res.ok) {
      const data = await res.json();
      setVotingWindow({ start: data.start ? data.start.slice(0,16) : '', end: data.end ? data.end.slice(0,16) : '' });
    }
  };
  const fetchRegistrationDueDate = async () => {
  const res = await fetch(`${ADMIN_API}/get-due-date`);
    if (res.ok) {
      const data = await res.json();
      setRegistrationDueDate(data.dueDate ? data.dueDate.slice(0,16) : '');
    }
  };

  useEffect(() => { fetchVotingWindow(); fetchRegistrationDueDate(); fetchAllCandidates(); }, []);

  const action = async (id, act) => {
    setMessage('');
  const res = await fetch(`${CANDIDATE_API}/${id}/${act}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { setMessage(data.message); fetchAllCandidates(); }
    else setMessage(data.message || 'Error');
  };
  const remove = async (id) => {
  const res = await fetch(`${CANDIDATE_API}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { setMessage(data.message); fetchAllCandidates(); }
    else setMessage(data.message || 'Error');
  };

  const pending = candidates.filter(c => c.status === 'pending');
  const approved = candidates.filter(c => c.status === 'approved');
  const rejected = candidates.filter(c => c.status === 'rejected');

  const StatusBadge = ({ status }) => {
    const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'yellow';
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-${color}-100 text-${color}-700 capitalize`}>{status}</span>;
  };

  const CandidateRow = ({ c }) => (
    <tr className="border-b last:border-none">
      <td className="p-2 flex items-center gap-2">{c.photoUrl && <img src={c.photoUrl} className="w-10 h-10 rounded object-cover"/>}<div><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.usn}</div></div></td>
      <td className="p-2 text-sm">{c.position}</td>
      <td className="p-2 text-sm">{c.email}</td>
      <td className="p-2"><StatusBadge status={c.status} /></td>
      <td className="p-2 text-right space-x-2">
        {c.status !== 'approved' && <button onClick={()=>action(c._id,'approve')} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Approve</button>}
        {c.status !== 'rejected' && <button onClick={()=>action(c._id,'reject')} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">Reject</button>}
        <button onClick={()=>remove(c._id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Delete</button>
      </td>
    </tr>
  );

  const SettingsView = () => (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Registration Due Date</h3>
        <form onSubmit={async e=>{e.preventDefault();setSavingDueDate(true);setMessage('');const res=await fetch(`${ADMIN_API}/set-due-date`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ dueDate: registrationDueDate })});const data=await res.json();if(res.ok) setMessage(data.message); else setMessage(data.message||'Error saving due date');setSavingDueDate(false);}} className="grid md:grid-cols-2 gap-4 items-end">
          <label className="flex flex-col text-sm">Registration Deadline
            <input type="datetime-local" value={registrationDueDate} onChange={e=>setRegistrationDueDate(e.target.value)} className="mt-1 border rounded px-2 py-1" required />
          </label>
          <button disabled={savingDueDate} className="bg-red-600 text-white px-4 py-2 rounded h-10 mt-4 md:mt-0">{savingDueDate?'Saving...':'Save Due Date'}</button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Candidates cannot register after this date.</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Voting Window</h3>
        <form onSubmit={async e=>{e.preventDefault();setSavingWindow(true);setMessage('');const body={ start:votingWindow.start,end:votingWindow.end||undefined };const res=await fetch(`${ADMIN_API}/set-voting-window`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(res.ok) setMessage(data.message); else setMessage(data.message||'Error saving window');setSavingWindow(false);}} className="grid md:grid-cols-3 gap-4 items-end">
          <label className="flex flex-col text-sm">Start
            <input type="datetime-local" value={votingWindow.start} onChange={e=>setVotingWindow(v=>({...v,start:e.target.value}))} className="mt-1 border rounded px-2 py-1" required />
          </label>
            <label className="flex flex-col text-sm">End (optional)
            <input type="datetime-local" value={votingWindow.end} onChange={e=>setVotingWindow(v=>({...v,end:e.target.value}))} className="mt-1 border rounded px-2 py-1" />
          </label>
          <button disabled={savingWindow} className="bg-accent-600 text-white px-4 py-2 rounded h-10 mt-4 md:mt-0">{savingWindow?'Saving...':'Save Window'}</button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Users can request OTP / vote only within the start–end window.</p>
      </div>
    </div>
  );

  const RegistrationView = () => (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Candidate Registrations</h3>
        <button onClick={fetchAllCandidates} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">Refresh</button>
      </div>
      {loadingCandidates ? <div className="py-10 text-center text-gray-500">Loading...</div> : (
        <div className="overflow-auto text-sm">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Candidate</th>
                <th className="p-2">Position</th>
                <th className="p-2">Email</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.concat(approved).concat(rejected).length === 0 && !message && <tr><td colSpan="5" className="p-6 text-center text-gray-500">No candidates yet</td></tr>}
              {pending.concat(approved).concat(rejected).length === 0 && message && <tr><td colSpan="5" className="p-6 text-center text-red-600">{message}</td></tr>}
              {pending.map(c=><CandidateRow key={c._id} c={c} />)}
              {approved.length>0 && <tr className="bg-green-50"><td colSpan="5" className="p-2 font-semibold text-green-700">Approved</td></tr>}
              {approved.map(c=><CandidateRow key={c._id} c={c} />)}
              {rejected.length>0 && <tr className="bg-red-50"><td colSpan="5" className="p-2 font-semibold text-red-700">Rejected</td></tr>}
              {rejected.map(c=><CandidateRow key={c._id} c={c} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-60 bg-white border-r flex flex-col">
        <div className="px-4 py-4 font-bold text-lg border-b">Admin Panel</div>
        <nav className="flex-1 p-2 space-y-1 text-sm">
          {['settings','registration','analytics'].map(key => {
            const label = key.charAt(0).toUpperCase()+key.slice(1);
            const active = view===key;
            return <button key={key} onClick={()=>setView(key)} className={`w-full text-left px-3 py-2 rounded transition ${active?'bg-accent-600 text-white':'hover:bg-accent-50 text-gray-700'}`}>{label}{key==='registration' && candidates.length>0 && <span className="ml-2 text-xs bg-gray-200 rounded px-2">{pending.length} pending</span>}</button>;
          })}
        </nav>
        {message && <div className="p-3 text-xs bg-green-50 text-green-700 border-t max-h-32 overflow-auto">{message}</div>}
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {view==='settings' && <SettingsView />}
        {view==='registration' && <RegistrationView />}
        {view==='analytics' && <div className="-m-6"><Analytics /></div>}
      </main>
    </div>
  );
}
