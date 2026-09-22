'use client';

import { useState } from 'react';
import { Room, Floor } from '../types/directory';
import { X, Copy, Check, MapPin, Sparkles, Navigation, Share2, Mail, Phone, ExternalLink, BookOpen, GraduationCap, User, Award } from 'lucide-react';

interface RoomDetailModalProps {
  room: Room | null;
  floor: Floor | null;
  onClose: () => void;
}

export default function RoomDetailModal({
  room,
  floor,
  onClose,
}: RoomDetailModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!room || !floor) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/?floor=${floor.id}&room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
          maxWidth: '560px',
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
          padding: '20px 24px',
          backgroundColor: '#B91C1C',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                {floor.nameMalay} ({floor.levelCode})
              </span>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {room.wingName}
              </span>
              {room.shortform && (
                <span style={{
                  backgroundColor: '#FFFFFF',
                  color: '#B91C1C',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                }}>
                  {room.shortform}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1.2 }}>
              {room.name}
            </h2>
            {room.nameEn && (
              <div style={{ fontSize: '13px', color: '#FECACA', marginTop: '2px' }}>
                {room.nameEn}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Room Code Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FEF2F2',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #FEE2E2'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#7F1D1D', fontWeight: 600 }}>KOD LOKASI RASMI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#991B1B' }}>{room.code}</span>
                {room.shortform && (
                  <span style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                  }}>
                    {room.shortform}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FECACA',
                  color: copiedCode ? '#16A34A' : '#B91C1C',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode ? 'Disalin!' : 'Salin Kod'}</span>
              </button>

              <button
                onClick={handleShareLink}
                title="Kongsi Pautan"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FECACA',
                  color: copiedLink ? '#16A34A' : '#B91C1C',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedLink ? 'Pautan Disalin!' : 'Kongsi'}</span>
              </button>
            </div>
          </div>

          {/* Lecturer Profiles (if this room is an office of one or more lecturers) */}
          {(() => {
            const lecturersList = room.lecturers && room.lecturers.length > 0
              ? room.lecturers
              : (room.lecturer ? [room.lecturer] : []);

            if (lecturersList.length === 0) return null;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {lecturersList.map((lec, lIdx) => (
                  <div
                    key={lec.id || lIdx}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #FECACA',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(185, 28, 28, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Header: Avatar + Name + Title + Role */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#FEE2E2',
                        border: '2px solid #FECACA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {lec.avatarUrl ? (
                          <img
                            src={lec.avatarUrl}
                            alt={lec.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <User size={28} color="#B91C1C" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#B91C1C',
                            backgroundColor: '#FEF2F2',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            border: '1px solid #FECACA'
                          }}>
                            {lec.role || 'Pensyarah'}
                          </span>
                          {lec.title && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                              {lec.title}
                            </span>
                          )}
                        </div>
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: 900,
                          color: '#0F172A',
                          marginTop: '4px',
                          lineHeight: 1.3
                        }}>
                          {lec.name}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {lec.department}
                        </p>
                      </div>
                    </div>

                    {/* Contact & Community Links */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {lec.email && (
                        <a
                          href={`mailto:${lec.email}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#0F172A',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                          title={lec.email}
                        >
                          <Mail size={13} color="#DC2626" />
                          <span>{lec.email}</span>
                        </a>
                      )}

                      {lec.phone && (
                        <a
                          href={`tel:${lec.phone.replace(/\s+/g, '')}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#0F172A',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={13} color="#DC2626" />
                          <span>{lec.phone}</span>
                        </a>
                      )}

                      {lec.communityUrl && (
                        <a
                          href={lec.communityUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#991B1B',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            marginLeft: 'auto'
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>Profil UTHM</span>
                        </a>
                      )}
                    </div>

                    {/* Kursus / Subjek Diajar (#TEA) */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#991B1B',
                        marginBottom: '8px'
                      }}>
                        <BookOpen size={14} color="#DC2626" />
                        <span>KURSUS / SUBJEK DIAJAR</span>
                        {lec.currentSubjects && lec.currentSubjects.length > 0 && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            marginLeft: '4px'
                          }}>
                            {lec.currentSubjects.length}
                          </span>
                        )}
                      </div>

                      {lec.currentSubjects && lec.currentSubjects.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {lec.currentSubjects.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  fontWeight: 900,
                                  backgroundColor: '#FEF2F2',
                                  color: '#991B1B',
                                  border: '1px solid #FECACA',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {sub.code}
                                </span>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#1E293B',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {sub.name}
                                </span>
                              </div>
                              <span style={{
                                fontSize: '11px',
                                color: '#64748B',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}>
                                {sub.session.replace('Session', 'Sesi').replace('Semester', 'Sem')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '12px',
                          color: '#64748B',
                          fontStyle: 'italic',
                          padding: '8px 12px',
                          backgroundColor: '#F8FAFC',
                          borderRadius: '8px',
                          border: '1px dashed #CBD5E1'
                        }}>
                          Tiada rekod subjek aktif bagi sesi ini di portal UTHM.
                        </div>
                      )}
                    </div>

                    {/* Kepakaran & Penyelidikan (#FOE) */}
                    {lec.specialities && lec.specialities.length > 0 && (
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#991B1B',
                          marginBottom: '6px'
                        }}>
                          <GraduationCap size={14} color="#DC2626" />
                          <span>BIDANG KEPAKARAN & PENYELIDIKAN</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {lec.specialities.map((spec, spIdx) => (
                            <span
                              key={spIdx}
                              style={{
                                backgroundColor: '#EFF6FF',
                                color: '#1E40AF',
                                border: '1px solid #BFDBFE',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}


          {/* Description */}
          {room.description && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#991B1B', marginBottom: '6px' }}>
                PERIHAL RUANG
              </div>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                {room.description}
              </p>
            </div>
          )}

          {/* Directions */}
          {room.directions && (
            <div style={{
              backgroundColor: '#F8FAFC',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <Navigation size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                  Panduan Dari Lif Utama:
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                  {room.directions}
                </div>
              </div>
            </div>
          )}

          {/* Facilities */}
          {room.facilities && room.facilities.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#991B1B', marginBottom: '8px' }}>
                KEMUDAHAN DISEDIAKAN
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {room.facilities.map((f, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#FEF2F2',
                      color: '#991B1B',
                      border: '1px solid #FECACA',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sparkles size={12} color="#DC2626" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Location Hint */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#FEF2F2',
              borderRadius: '12px',
              border: '1px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kedudukan di Bangunan
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                Aras {floor.levelCode} • {floor.nameMalay} ({room.wingName || 'FSKTM'})
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#B91C1C',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(185, 28, 28, 0.25)',
              }}
            >
              Kembali ke Pelan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
