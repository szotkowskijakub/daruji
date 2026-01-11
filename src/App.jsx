import React, { useState, useEffect, useRef } from 'react';
import { Camera, Package, User, Check, Plus, ArrowLeft, Gift, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selectedItem, setSelectedItem] = useState(null);
  const [reserveName, setReserveName] = useState('');
  const [showReserveForm, setShowReserveForm] = useState(false);
  const [userName, setUserName] = useState('');
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [newItem, setNewItem] = useState({ title: '', description: '', image: null });
  const fileInputRef = useRef(null);

  // Load user name from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('daruji-username');
    if (savedUser) {
      setUserName(savedUser);
    } else {
      setShowUserPrompt(true);
      setLoading(false);
    }
  }, []);

  // Subscribe to Firestore updates (real-time)
  useEffect(() => {
    if (!userName) return;

    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          reservedAt: doc.data().reservedAt?.toDate?.()?.toISOString() || null
        }));
        setItems(itemsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Nepodařilo se načíst data. Zkontrolujte připojení.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userName]);

  const saveUserName = (name) => {
    setUserName(name);
    setShowUserPrompt(false);
    localStorage.setItem('daruji-username', name);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 600;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      setNewItem({ ...newItem, image: compressed });
    }
  };

  const addItem = async () => {
    if (!newItem.title || !newItem.image) return;
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'items'), {
        title: newItem.title,
        description: newItem.description,
        image: newItem.image,
        owner: userName,
        createdAt: serverTimestamp(),
        reserved: false,
        reservedBy: null,
        reservedAt: null
      });
      
      setNewItem({ title: '', description: '', image: null });
      setView('list');
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Nepodařilo se přidat položku');
    }
    setSaving(false);
  };

  const reserveItem = async () => {
    if (!reserveName.trim() || !selectedItem) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'items', selectedItem.id), {
        reserved: true,
        reservedBy: reserveName,
        reservedAt: serverTimestamp()
      });
      
      setSelectedItem({ 
        ...selectedItem, 
        reserved: true, 
        reservedBy: reserveName, 
        reservedAt: new Date().toISOString() 
      });
      setShowReserveForm(false);
      setReserveName('');
    } catch (err) {
      console.error('Error reserving item:', err);
      setError('Nepodařilo se rezervovat položku');
    }
    setSaving(false);
  };

  const cancelReservation = async (itemId) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'items', itemId), {
        reserved: false,
        reservedBy: null,
        reservedAt: null
      });
      
      if (selectedItem?.id === itemId) {
        setSelectedItem({ ...selectedItem, reserved: false, reservedBy: null, reservedAt: null });
      }
    } catch (err) {
      console.error('Error canceling reservation:', err);
      setError('Nepodařilo se zrušit rezervaci');
    }
    setSaving(false);
  };

  const deleteItem = async (itemId) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setView('list');
      setSelectedItem(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Nepodařilo se smazat položku');
    }
    setSaving(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Error banner component
  const ErrorBanner = () => error ? (
    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
      <span>{error}</span>
      <button onClick={() => setError(null)} className="text-red-700 font-bold">×</button>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Načítám...</p>
        </div>
      </div>
    );
  }

  // User name prompt
  if (showUserPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Gift className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Vítejte v Dáruji</h1>
            <p className="text-gray-600 mt-2">Sdílejte věci, které už nepotřebujete</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jak vám máme říkat?</label>
              <input
                type="text"
                value={tempUserName}
                onChange={(e) => setTempUserName(e.target.value)}
                placeholder="Vaše jméno nebo přezdívka"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                onKeyDown={(e) => e.key === 'Enter' && tempUserName && saveUserName(tempUserName)}
              />
            </div>
            <button
              onClick={() => tempUserName && saveUserName(tempUserName)}
              disabled={!tempUserName}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Pokračovat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add item view
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-4 mb-6 pt-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Přidat věc</h1>
          </div>
          
          <ErrorBanner />
          
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
            >
              {newItem.image ? (
                <img src={newItem.image} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Klikněte pro nahrání fotky</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Název věci *</label>
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="např. Starý gauč"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Popis</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Stav, rozměry, kde k vyzvednutí..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>
            
            <button
              onClick={addItem}
              disabled={!newItem.title || !newItem.image || saving}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {saving ? 'Ukládám...' : 'Přidat věc'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detail view
  if (view === 'detail' && selectedItem) {
    const isOwner = selectedItem.owner === userName;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-4 mb-6 pt-4">
            <button onClick={() => { setView('list'); setSelectedItem(null); setShowReserveForm(false); }} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Detail</h1>
          </div>
          
          <ErrorBanner />
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-64 object-cover" />
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-800">{selectedItem.title}</h2>
                {selectedItem.reserved && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    Rezervováno
                  </span>
                )}
              </div>
              
              {selectedItem.description && (
                <p className="text-gray-600 mb-4">{selectedItem.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <User className="w-4 h-4" />
                <span>Nabízí: {selectedItem.owner}</span>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">
                Přidáno: {formatDate(selectedItem.createdAt)}
              </p>
              
              {isOwner && selectedItem.reserved && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <p className="font-medium text-emerald-800">Rezervoval/a: {selectedItem.reservedBy}</p>
                  <p className="text-sm text-emerald-600 mt-1">{formatDate(selectedItem.reservedAt)}</p>
                  <button
                    onClick={() => cancelReservation(selectedItem.id)}
                    disabled={saving}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    {saving ? 'Ruším...' : 'Zrušit rezervaci'}
                  </button>
                </div>
              )}
              
              {!isOwner && !selectedItem.reserved && !showReserveForm && (
                <button
                  onClick={() => setShowReserveForm(true)}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Mám zájem - rezervovat
                </button>
              )}
              
              {showReserveForm && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    placeholder="Vaše jméno"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowReserveForm(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={reserveItem}
                      disabled={!reserveName.trim() || saving}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Potvrdit
                    </button>
                  </div>
                </div>
              )}
              
              {!isOwner && selectedItem.reserved && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-800">Tuto věc už si někdo zarezervoval</p>
                </div>
              )}
              
              {isOwner && (
                <button
                  onClick={() => {
                    if (confirm('Opravdu chcete smazat tuto položku?')) {
                      deleteItem(selectedItem.id);
                    }
                  }}
                  disabled={saving}
                  className="w-full mt-4 bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  {saving ? 'Mažu...' : 'Smazat položku'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // My items view
  if (view === 'my-items') {
    const myItems = items.filter(item => item.owner === userName);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-4 mb-6 pt-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Moje věci</h1>
          </div>
          
          <ErrorBanner />
          
          {myItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Zatím jste nepřidali žádné věci</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setView('detail'); }}
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex">
                    <img src={item.image} alt={item.title} className="w-24 h-24 object-cover" />
                    <div className="p-4 flex-1">
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                      {item.reserved ? (
                        <p className="text-sm text-emerald-600 mt-1">
                          ✓ Rezervoval/a: {item.reservedBy}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">Čeká na zájemce</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="max-w-lg mx-auto p-4 pb-24">
        <div className="flex items-center justify-between py-4 mb-4">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-emerald-500" />
            <h1 className="text-2xl font-bold text-gray-800">Dáruji</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('my-items')}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              title="Moje věci"
            >
              <User className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        
        <ErrorBanner />
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{items.filter(i => !i.reserved).length}</p>
            <p className="text-sm text-gray-500">Dostupných</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{items.filter(i => i.reserved).length}</p>
            <p className="text-sm text-gray-500">Rezervovaných</p>
          </div>
        </div>
        
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Zatím tu nic není</p>
            <p className="text-sm text-gray-400">Buďte první, kdo přidá věc k darování!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => { setSelectedItem(item); setView('detail'); }}
                className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${item.reserved ? 'opacity-75' : ''}`}
              >
                <div className="relative">
                  <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
                  {item.reserved && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Rezervováno
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.owner}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={() => setView('add')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
