import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const AvatarOptionsPortal = ({ isOpen, onViewAvatar, onChangeAvatar, position }) => {
  if (!isOpen) return null;

  // Tạo ref để xác định click bên trong component
  const menuRef = useRef(null);

  // Xử lý Click trực tiếp vào từng nút
  const handleViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Xem avatar được nhấn");
    onViewAvatar && onViewAvatar();
    return false; // Ngăn các sự kiện khác
  };

  const handleChangeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Thay avatar được nhấn");
    onChangeAvatar && onChangeAvatar();
    return false; // Ngăn các sự kiện khác
  };

  const style = {
    position: 'fixed',
    top: position.top + 'px',
    left: position.left + 'px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    width: '180px',
    zIndex: 9999999,
    overflow: 'visible',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto'
  };

  return ReactDOM.createPortal(
    <div 
      className="avatar-options-portal" 
      style={style}
      onClick={(e) => e.stopPropagation()}
      ref={menuRef}
    >
      <a 
        href="#"
        onClick={handleViewClick}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          textDecoration: 'none',
          color: '#333',
          boxSizing: 'border-box'
        }}
      >
        <i className="fas fa-eye" style={{ fontSize: '16px', width: '20px', color: '#4caf50', marginRight: '8px' }}></i>
        Xem avatar
      </a>
      <a
        href="#"
        onClick={handleChangeClick}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'none',
          color: '#333',
          boxSizing: 'border-box'
        }}
      >
        <i className="fas fa-camera" style={{ fontSize: '16px', width: '20px', color: '#4caf50', marginRight: '8px' }}></i>
        Thay avatar
      </a>
    </div>,
    document.body
  );
};

export default AvatarOptionsPortal;