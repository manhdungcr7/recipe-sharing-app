import React, { useState } from 'react';
import './ReportForm.css';

const ReportForm = ({ type, targetId, onSubmit, onCancel }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            setError('Please select a reason for reporting');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/reports/${type}/${targetId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason, description })
            });

            if (response.ok) {
                setSuccess(true);
                if (onSubmit) onSubmit();
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to submit report');
            }
        } catch (err) {
            console.error('Error submitting report:', err);
            setError('An error occurred while submitting the report');
        } finally {
            setSubmitting(false);
        }
    };

    const reasonOptions = {
        recipe: [
            'Inappropriate content',
            'Misleading information',
            'Copyright violation',
            'Offensive language',
            'Other'
        ],
        comment: [
            'Spam',
            'Harassment',
            'Inappropriate content',
            'Offensive language',
            'Other'
        ],
        user: [
            'Inappropriate profile',
            'Fake account',
            'Spamming',
            'Harassment',
            'Other'
        ]
    };

    if (success) {
        return (
            <div className="report-form-success">
                <h3>Report Submitted</h3>
                <p>Thank you for your report. Our team will review it soon.</p>
                <button onClick={onCancel}>Close</button>
            </div>
        );
    }

    return (
        <div className="report-form-container">
            <h3>Report {type === 'recipe' ? 'Recipe' : type === 'comment' ? 'Comment' : 'User'}</h3>
            
            {error && (
                <div className="report-form-error">
                    <p>{error}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="report-form">
                <div className="form-group">
                    <label>Reason for reporting*</label>
                    <select 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                        required
                    >
                        <option value="">Select a reason</option>
                        {reasonOptions[type].map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Additional details (optional)</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide more details about this report"
                        rows={4}
                    ></textarea>
                </div>
                
                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="btn-cancel"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn-submit"
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportForm;