import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import React from "react";
import styles from "./StationMap.module.scss";

import icon from "leaflet/dist/images/marker-icon.png";
import shadowIcon from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: shadowIcon.src,
});

L.Marker.prototype.options.icon = DefaultIcon;

type Props = {
    latitude: number;
    longitude: number;
};

const StationMap = (props: Props) => {
    return (
        <MapContainer
            center={[props.latitude, props.longitude]}
            zoom={16}
            scrollWheelZoom={false}
            className={styles.leafletContainer}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[props.latitude, props.longitude]} />
        </MapContainer>
    );
};

export default StationMap;
