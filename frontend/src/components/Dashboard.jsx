import React from 'react';
import Calendar from './Calendar/Calendar';

export default function Dashboard() {
    return (
        <div className="card mb-4">
            <div className="card-inner">
                <div className="card-body">
                    <Calendar />
                </div>
            </div>
        </div>
    );
}