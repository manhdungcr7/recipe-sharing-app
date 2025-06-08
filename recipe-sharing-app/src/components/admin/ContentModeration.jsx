import React, { useEffect, useState } from 'react';
import { getReports, moderateContent } from '../../services/adminService';
import './ContentModeration.css';

const ContentModeration = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await getReports();
                setReports(data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleModerate = async (reportId, action) => {
        try {
            await moderateContent(reportId, action);
            setReports(reports.filter(report => report.id !== reportId));
        } catch (error) {
            console.error('Error moderating content:', error);
        }
    };

    if (loading) {
        return <div>Loading reports...</div>;
    }

    return (
        <div className="content-moderation">
            <h2>Content Moderation</h2>
            {reports.length === 0 ? (
                <p>No reports to review.</p>
            ) : (
                <ul>
                    {reports.map(report => (
                        <li key={report.id}>
                            <p>{report.content}</p>
                            <button onClick={() => handleModerate(report.id, 'approve')}>Approve</button>
                            <button onClick={() => handleModerate(report.id, 'reject')}>Reject</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ContentModeration;