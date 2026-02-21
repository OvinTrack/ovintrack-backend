// PopUp.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

interface PopUpProps {
    title: string;
    name: string;
    description: string;
}

export function renderPopup(marker: L.Marker, props: PopUpProps) {
  // Crée un div temporaire pour le popup
  const popupDiv = document.createElement('div');

  // Monte le composant React dans ce div
  const root = ReactDOM.createRoot(popupDiv);
  root.render(
    <div style={{ minWidth: '200px' }}>
	  <h3>{props.title}</h3>
	  <p>{props.name}</p>
	  <p>{props.description}</p>
    </div>
  );

  // Crée et ouvre le popup sur le marker
  marker.bindPopup(popupDiv).openPopup();

  // Retourne la racine pour nettoyage si nécessaire
  return root;
}
