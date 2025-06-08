import React, { useEffect, useState } from 'react';
import { getReports } from '../../services/adminService';
import './ReportsList.css';

const ReportsList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await getReports();
                setReports(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return <div>Loading reports...</div>;
    }

    if (error) {
        return <div>Error fetching reports: {error}</div>;
    }

    return (
        <div className="reports-list">
            <h2>Reports List</h2>
            {reports.length === 0 ? (
                <p>No reports available.</p>
            ) : (
                <ul>
                    {reports.map((report) => (
                        <li key={report.id}>
                            <h3>{report.title}</h3>
                            <p>{report.description}</p>
                            <p>Status: {report.status}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ReportsList;