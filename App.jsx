import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, Button, Text, Alert} from 'react-native'; // Import Alert
import MapView, {Marker, Polyline} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Geolocation from '@react-native-community/geolocation'; // Import Geolocation

const NavigationComponent = () => {
  const [destination, setDestination] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (destination) {
      setInitialRegion({
        ...initialRegion,
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    }
    if (destination && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000,
      );
    }
    if (origin && destination) {
      fetchRoute(origin, destination);
    }
  }, [destination, origin]);

  const fetchRoute = async (origin, destination) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=GOOGLE_MAP_API_KEY`,
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const json = await response.json();
      const points = json.routes[0].overview_polyline.points;
      const coordinates = decodePolyline(points);
      setRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to fetch route. Please try again.');
    }
  };

  const handleGetDirections = () => {
    if (destination && origin) {
      const data = {
        source: origin,
        destination: destination,
        params: [
          {
            key: 'travelmode',
            value: 'driving',
          },
        ],
      };
      getDirections(data);
    }
  };
  console.log('origin', origin);

  const handleGetCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setInitialRegion({
          ...initialRegion,
          latitude,
          longitude,
        });
        setOrigin({latitude, longitude});
      },
      error => {
        if (error.code === 3) {
          console.error('Location request timed out');
          Alert.alert(
            'Error',
            'Failed to get current location. Please make sure location services are enabled and try again.',
          );
        } else {
          console.error('Error getting current location:', error);
          Alert.alert(
            'Error',
            'Failed to get current location. Please try again.',
          );
        }
      },
      {enableHighAccuracy: false, timeout: 5000, maximumAge: 1000},
    );
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {destination && <Marker coordinate={destination} />}
        {origin && <Marker coordinate={origin} pinColor="blue" />}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#000"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.inputContainer}>
        <GooglePlacesAutocomplete
          placeholder="Enter Destination"
          onPress={(data, details = null) => {
            setDestination({
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }}
          fetchDetails={true}
          query={{
            key: 'GOOGLE_MAP_API_KEY',
            language: 'en',
          }}
          styles={{
            textInput: styles.textInput,
          }}
        />
        <GooglePlacesAutocomplete
          placeholder="Enter Origin"
          onPress={(data, details = null) => {
            setOrigin({
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }}
          fetchDetails={true}
          query={{
            key: 'GOOGLE_MAP_API_KEY',
            language: 'en',
          }}
          styles={{
            textInput: styles.textInput,
          }}
        />
        <Button title="Get Directions" onPress={handleGetDirections} />
        <Button
          title="Get Current Location"
          onPress={handleGetCurrentLocation}
        />
      </View>
    </View>
  );
};

const decodePolyline = encoded => {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({latitude: lat / 1e5, longitude: lng / 1e5});
  }

  return coordinates;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 3,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  textInput: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});

export default NavigationComponent;
