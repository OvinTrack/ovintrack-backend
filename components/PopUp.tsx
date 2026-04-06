// PopUp.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

interface PopUpProps
{
    title: string;
    uniqueId: string;
    DZId: string;
    eleveurId: string;
    espace: string;
    race: string;
    sexe: string;
    dateNaissance: string;
    statutReproducteur: string;
    origine: string;
    status: string;
}

export function renderPopup(marker: L.Marker, props: PopUpProps)
{
  const popupDiv = document.createElement('div');

  const root = ReactDOM.createRoot(popupDiv);
  root.render(
    <>
      <h3>{props.title}</h3>
      <p>uniqueId : {props.uniqueId}</p>
      <p>DZId : {props.DZId}</p>
      <p>Éleveur : {props.eleveurId}</p>
      <p>Espace : {props.espace}</p>
      <p>Race : {props.race}</p>
      <p>Sexe : {props.sexe}</p>
      <p>Naissance : {props.dateNaissance}</p>
      <p>Reproducteur : {props.statutReproducteur}</p>
      <p>Origine : {props.origine}</p>
      <p>Statut vaccinal : {props.status}</p>
    </>
  );

  // Crée et ouvre le popup sur le marker
  marker.bindPopup(popupDiv, { minWidth: 200 }).openPopup();

  // Retourne la racine pour nettoyage si nécessaire
  return root;
}
