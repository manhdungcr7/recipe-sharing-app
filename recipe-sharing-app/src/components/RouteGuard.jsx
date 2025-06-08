// Tạo component RouteGuard để xử lý logic chuyển hướng
import React from 'react';
import { useParams } from 'react-router-dom';

const RouteGuard = ({ children }) => {
  const params = useParams();
  return children({ params });
};

export default RouteGuard;