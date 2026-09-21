'use client';

import { X, Building, MapPin, Layers, Phone, Globe } from 'lucide-react';

interface BuildingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuildingInfoModal({
  isOpen,
  onClose,
}: BuildingInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 160ms ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          width: '100%',
          maxWidth: '680px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(185, 28, 28, 0.25)',
          border: '1px solid #FECACA',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          backgroundColor: '#B91C1C',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={22} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>
                Mengenai Bangunan FSKTM
              </div>
              <div style={{ fontSize: '12px', color: '#FECACA' }}>
                Fakulti Sains Komputer dan Teknologi Maklumat, UTHM
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Building Hero Photo */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/reffsktm/FSKTM.jpg"
              alt="Bangunan Menara FSKTM UTHM"
              style={{ width: '100%', height: '240px', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              color: '#FFFFFF'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Menara FSKTM & Sayap Akademik</div>
              <div style={{ fontSize: '12px', color: '#CBD5E1' }}>Pandangan hadapan fakulti berhadapan tasik UTHM</div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: '#FEF2F2',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #FEE2E2',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#991B1B' }}>8</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F1D1D' }}>Aras Keseluruhan</div>
            </div>

            <div style={{
              backgroundColor: '#FEF2F2',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #FEE2E2',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#991B1B' }}>3</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F1D1D' }}>Blok & Sayap</div>
            </div>

            <div style={{
              backgroundColor: '#FEF2F2',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #FEE2E2',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#991B1B' }}>120+</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7F1D1D' }}>Bilik & Makmal</div>
            </div>
          </div>

          {/* Structural Layout Info */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '14px 18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Susun Atur Struktur Kompleks FSKTM:
            </div>
            <ul style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, paddingLeft: '18px' }}>
              <li><strong>Blok Menara Tengah (Aras G hingga 7):</strong> Menempatkan lif utama, pejabat dekan, bilik mesyuarat eksekutif, dan bilik pejabat pensyarah siri PB.</li>
              <li><strong>Sayap Kiri (Aras G hingga 3):</strong> Pusat IT, ruang penyelidikan siswazah, bilik tutorial, ruang membaca, dan pusat penyelidikan AI/SMC.</li>
              <li><strong>Sayap Kanan (Aras G hingga 3):</strong> Makmal multimedia, realiti maya, studio AV, makmal keselamatan siber Cisco & Aruba, auditorium fakulti, dan surau.</li>
            </ul>
          </div>

          {/* Location & Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#DC2626" />
              <span>Universiti Tun Hussein Onn Malaysia (UTHM), 86400 Parit Raja, Batu Pahat, Johor</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="#DC2626" />
              <span>https://fsktm.uthm.edu.my</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
