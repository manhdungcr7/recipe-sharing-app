import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ReportForm from './ReportForm';
import './ReportButton.css';

const ReportButton = ({ type, targetId }) => {
    const [showReportForm, setShowReportForm] = useState(false);
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleReportClick = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setShowReportForm(true);
    };

    const handleCloseForm = () => {
        setShowReportForm(false);
    };

    const handleSubmitSuccess = () => {
        // Will be automatically closed by the success view in ReportForm
    };

    return (
        <>
            <button 
                className="report-button" 
                onClick={handleReportClick}
                title={`Report this ${type === 'recipe' ? 'recipe' : type === 'comment' ? 'comment' : 'user'}`}
            >
                <i className="fas fa-flag"></i>
                <span>Report</span>
            </button>

            {showReportForm && (
                <div className="report-modal-overlay">
                    <div className="report-modal">
                        <ReportForm 
                            type={type}
                            targetId={targetId}
                            onCancel={handleCloseForm}
                            onSubmit={handleSubmitSuccess}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportButton;