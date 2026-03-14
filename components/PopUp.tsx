// PopUp.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

interface PopUpProps
{
    title: string;
    uniqueId : string; // champ de Traccar
    DZId: string;
    status: string;
}

export function renderPopup(marker: L.Marker, props: PopUpProps)
{
  // Crée un div temporaire pour le popup
  const popupDiv = document.createElement('div');

  // Monte le composant React dans ce div
  const root = ReactDOM.createRoot(popupDiv);
  root.render(
    <>
      <h3>{props.title}</h3>
      <p>uniqueId : {props.uniqueId}</p>
      <p>DZId : {props.DZId}</p>
      <p>statut : {props.status}</p>
    </>

  );

  // Crée et ouvre le popup sur le marker
  marker.bindPopup(popupDiv, { minWidth: 200 }).openPopup();

  // Retourne la racine pour nettoyage si nécessaire
  return root;
}
