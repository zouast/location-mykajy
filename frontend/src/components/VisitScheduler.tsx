import React, { useEffect, useState } from 'react';
import VisitsService from '../services/visits.service';

type Props = {
  listingId: string;
};

export const VisitScheduler: React.FC<Props> = ({ listingId }) => {
  const [datetime, setDatetime] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = async () => {
    try {
      const data = await VisitsService.getVisits({ listingId });
      setVisits(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [listingId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const scheduled = new Date(datetime);
      // Client-side conflict prevention
      const conflict = visits.some((v) => {
        const vStart = new Date(v.scheduledAt);
        const vEnd = new Date(vStart.getTime() + (v.duration || 30) * 60 * 1000);
        const end = new Date(scheduled.getTime() + duration * 60 * 1000);
        return vStart < end && vEnd > scheduled;
      });
      if (conflict) {
        setError('Conflit détecté : créneau indisponible');
        setLoading(false);
        return;
      }

      await VisitsService.createVisit({ listingId, scheduledAt: scheduled.toISOString(), duration, clientNotes: notes });
      setDatetime('');
      setDuration(30);
      setNotes('');
      await fetchVisits();
      alert('Demande de visite envoyée');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visit-scheduler">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label>
          Date et heure
          <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
        </label>
        <label>
          Durée (minutes)
          <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value || '30'))} min={5} />
        </label>
        <label>
          Commentaire
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>Demander une visite</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>

      <h4>Visites programmées</h4>
      <ul>
        {visits.map((v) => (
          <li key={v.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {new Date(v.scheduledAt).toLocaleString()} — {v.duration || 30} min — {v.status}
            </div>
            {v.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    try {
                      await VisitsService.updateStatus(v.id, { status: 'CONFIRMED' });
                      await fetchVisits();
                    } catch (err: any) {
                      alert(err?.response?.data?.message || err.message || 'Erreur');
                    }
                  }}
                >
                  Confirmer
                </button>
                <button
                  onClick={async () => {
                    try {
                      await VisitsService.updateStatus(v.id, { status: 'CANCELLED', cancelReason: 'Annulé par l’agent' });
                      await fetchVisits();
                    } catch (err: any) {
                      alert(err?.response?.data?.message || err.message || 'Erreur');
                    }
                  }}
                >
                  Annuler
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VisitScheduler;
