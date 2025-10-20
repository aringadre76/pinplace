import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Map, Pin } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LockStatusBadge } from '../components/LockStatusBadge';
import { useNavigate } from 'react-router-dom';
import { exportToCSV, exportToKML } from '../lib/export';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingMapId, setExportingMapId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const mapsRef = collection(db, 'maps');
    const q = query(mapsRef, where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mapsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Map[];
        setMaps(mapsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching maps:', err);
        setError('Failed to load maps');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleToggleLock = async (mapId: string, currentLockStatus: boolean) => {
    try {
      const mapRef = doc(db, 'maps', mapId);
      await updateDoc(mapRef, {
        isLocked: !currentLockStatus
      });
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'maps', mapId));
    } catch (err) {
      console.error('Failed to delete map:', err);
    }
  };

  const handleExportCSV = async (map: Map) => {
    setExportingMapId(map.id);
    try {
      const pinsRef = collection(db, 'maps', map.id, 'pins');
      const pinsSnapshot = await getDocs(pinsRef);
      const pins = pinsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pin[];
      exportToCSV(pins, map.name);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setExportingMapId(null);
    }
  };

  const handleExportKML = async (map: Map) => {
    setExportingMapId(map.id);
    try {
      const pinsRef = collection(db, 'maps', map.id, 'pins');
      const pinsSnapshot = await getDocs(pinsRef);
      const pins = pinsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pin[];
      exportToKML(pins, map.name);
    } catch (err) {
      console.error('Failed to export KML:', err);
    } finally {
      setExportingMapId(null);
    }
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Maps</h1>
          <p className="text-gray-600">Manage your collaborative maps</p>
        </div>
        <Button onClick={() => navigate('/create')} className="w-full sm:w-auto">
          Create New Map
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {maps.length === 0 ? (
        <Card className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-gray-100 text-gray-400 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maps yet</h3>
          <p className="text-gray-500 mb-4">Create your first collaborative map to get started.</p>
          <Button onClick={() => navigate('/create')}>
            Create Your First Map
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <Card key={map.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {map.name}
                </h3>
                <LockStatusBadge map={map} />
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Created {map.createdAt.toDate().toLocaleDateString()}
              </p>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/map/${map.id}`)}
                    className="col-span-2"
                  >
                    View Map
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleLock(map.id, map.isLocked)}
                  >
                    {map.isLocked ? 'Unlock' : 'Lock'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteMap(map.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleExportCSV(map)}
                    disabled={exportingMapId === map.id}
                  >
                    {exportingMapId === map.id ? 'Exporting...' : 'CSV'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleExportKML(map)}
                    disabled={exportingMapId === map.id}
                  >
                    {exportingMapId === map.id ? 'Exporting...' : 'KML'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
