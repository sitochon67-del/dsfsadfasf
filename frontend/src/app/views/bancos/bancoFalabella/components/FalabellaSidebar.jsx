import React from 'react';
import logo_vigilado from '../img/vigilado.webp';

const FalabellaSidebar = () => {
    return (
        <aside className="falabella-sidebar">
            <div className="sidebar-content">
                <figure className="sidebar-image">
                    <img src={logo_vigilado} alt="Superintendencia Financiera de Colombia" />
                </figure>
            </div>
        </aside>
    );
};

export default FalabellaSidebar;
