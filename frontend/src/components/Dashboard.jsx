import React from 'react';
import Calendar from './Calendar/Calendar';

export default function Dashboard({ masterSlug }) {
    return (
        <div className="card mb-4">
            <div className="card-inner">
                <div className="card-body">
                    <Calendar masterSlug={masterSlug} />
                </div>
            </div>
        </div>
    );
}