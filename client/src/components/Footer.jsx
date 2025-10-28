import React from "react";
import "../style/Footer.css";

import facebookIcon from '../style/logos_e_imagenes/fb.png';
import instagramIcon from '../style/logos_e_imagenes/ig.png';
import whatsappIcon from '../style/logos_e_imagenes/wsp.png';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-main">
                    {/* Información de contacto */}
                    <div className="footer-info">
                        <p className="footer-text">
                            Copyright © 2025 INSTITUTO JEAN PIAGET Nº 8048 | Teléfono: 4223592 y 4232242 | Nivel Secundario
                        </p>
                    </div>
                    
                    {/* Redes Sociales */}
                    <div className="social-section">
                        <div className="social-links">
                            <a 
                                href="https://www.facebook.com/institutojeanpiaget.salta/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="social-link"
                                aria-label="Síguenos en Facebook"
                            >
                                <img src={facebookIcon} alt="Facebook" className="social-icon" />
                            </a>
                            
                            <a 
                                href="https://www.instagram.com/piagetensalta/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="social-link"
                                aria-label="Síguenos en Instagram"
                            >
                                <img src={instagramIcon} alt="Instagram" className="social-icon" />
                            </a>
                            
                            <a 
                                href="https://wa.me/1234567890" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="social-link"
                                aria-label="Contáctanos por WhatsApp"
                            >
                                <img src={whatsappIcon} alt="WhatsApp" className="social-icon" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;