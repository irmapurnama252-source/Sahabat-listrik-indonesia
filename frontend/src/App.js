import React, { useState, useEffect } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { Users, Phone, MapPin, Wrench, Home, UserPlus, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [tukangList, setTukangList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    city: '',
    whatsapp_number: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('');

  // Fetch all tukang from API
  const fetchTukang = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tukang`);
      if (response.ok) {
        const data = await response.json();
        setTukangList(data);
      } else {
        console.error('Failed to fetch tukang');
        setTukangList([]);
      }
    } catch (error) {
      console.error('Error fetching tukang:', error);
      setTukangList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load tukang data when viewing the list
  useEffect(() => {
    if (currentPage === 'list') {
      fetchTukang();
    }
  }, [currentPage]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nama harus diisi';
    }
    
    if (!formData.skills) {
      errors.skills = 'Keahlian harus dipilih';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'Kota harus diisi';
    }
    
    if (!formData.whatsapp_number.trim()) {
      errors.whatsapp_number = 'Nomor WhatsApp harus diisi';
    } else if (!/^\d{10,13}$/.test(formData.whatsapp_number.replace(/[\s\-\+]/g, ''))) {
      errors.whatsapp_number = 'Nomor WhatsApp tidak valid (10-13 digit)';
    }
    
    return errors;
  };

  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitStatus('');
      
      const response = await fetch(`${BACKEND_URL}/api/tukang`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', skills: '', city: '', whatsapp_number: '' });
        setTimeout(() => {
          setCurrentPage('home');
          setSubmitStatus('');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Generate WhatsApp contact URL
  const generateWhatsAppUrl = (phoneNumber, tukangName, skills) => {
    const message = encodeURIComponent(`Halo ${tukangName}, saya butuh jasa ${skills}. Apakah tersedia?`);
    const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <Wrench className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-blue-900">Jasa Tukang Hemat</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-800 mb-3">
              Temukan tukang terdekat dengan harga hemat
            </CardTitle>
            <div className="text-gray-600 text-base leading-relaxed">
              Platform terpercaya untuk menghubungkan Anda dengan tukang profesional di sekitar Anda.
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setCurrentPage('register')}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <UserPlus className="mr-3 h-6 w-6" />
              Daftar Sebagai Tukang
            </Button>
            
            <Button 
              onClick={() => setCurrentPage('list')}
              variant="outline"
              className="w-full h-14 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg font-semibold rounded-xl transition-all duration-200"
            >
              <Users className="mr-3 h-6 w-6" />
              Cari Tukang
            </Button>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center text-gray-700 bg-white p-4 rounded-lg shadow-sm">
            <Phone className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
            <span className="text-sm">Hubungi langsung via WhatsApp</span>
          </div>
          <div className="flex items-center text-gray-700 bg-white p-4 rounded-lg shadow-sm">
            <MapPin className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
            <span className="text-sm">Tukang terdekat di kota Anda</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Registration Form Component
  const RegistrationPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('home')}
              className="mr-3 p-2 text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-blue-900">Daftar Sebagai Tukang</h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-md mx-auto px-6 py-6">
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-800">
              Form Pendaftaran Tukang
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="h-12 text-base"
                />
                {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills" className="text-base font-medium">Keahlian</Label>
                <Select value={formData.skills} onValueChange={(value) => handleInputChange('skills', value)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Pilih keahlian utama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Listrik">Listrik</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Bangunan">Bangunan</SelectItem>
                    <SelectItem value="Servis AC">Servis AC</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.skills && <p className="text-red-500 text-sm">{formErrors.skills}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-base font-medium">Kota</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Contoh: Jakarta, Bandung, Surabaya"
                  className="h-12 text-base"
                />
                {formErrors.city && <p className="text-red-500 text-sm">{formErrors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-base font-medium">Nomor WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="08123456789"
                  className="h-12 text-base"
                />
                {formErrors.whatsapp_number && <p className="text-red-500 text-sm">{formErrors.whatsapp_number}</p>}
                <p className="text-xs text-gray-500">
                  Nomor ini akan digunakan untuk dihubungi customer
                </p>
              </div>

              <Separator />

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Mendaftar...' : 'Kirim Pendaftaran'}
              </Button>

              {submitStatus === 'success' && (
                <div className="text-center text-green-600 font-medium bg-green-50 p-3 rounded-lg">
                  ✓ Pendaftaran berhasil! Kembali ke beranda...
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="text-center text-red-600 font-medium bg-red-50 p-3 rounded-lg">
                  ✗ Gagal mendaftar. Silakan coba lagi.
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Tukang List Component
  const TukangListPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('home')}
              className="mr-3 p-2 text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-blue-900">Daftar Tukang</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Memuat daftar tukang...</div>
          </div>
        ) : tukangList.length === 0 ? (
          <Card className="border-blue-200 text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Belum ada tukang yang terdaftar</p>
              <Button
                onClick={() => setCurrentPage('register')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Daftar Sebagai Tukang Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tukangList.map((tukang) => (
              <Card key={tukang.id} className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {tukang.name}
                      </h3>
                      <div className="flex items-center text-blue-600 mb-2">
                        <Wrench className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">{tukang.skills}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{tukang.city}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(generateWhatsAppUrl(tukang.whatsapp_number, tukang.name, tukang.skills), '_blank')}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Hubungi via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'register':
        return <RegistrationPage />;
      case 'list':
        return <TukangListPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App;