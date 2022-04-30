import { StyleSheet } from 'react-native';
import { Text, View } from '../components/Themed';
import GooglePlacesInput from '../components/DestinationSearch';
import DestinationPopup from '../components/BottomSheet';
import { separateCrimeTypes, Crimes, Crime } from '../functions/helper';
import MapViewDirections, { MapViewDirectionsMode } from 'react-native-maps-directions';
import MapView, { Callout, Marker, EventUserLocation, PROVIDER_GOOGLE } from 'react-native-maps';
import { useState, useLayoutEffect, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAtom } from 'jotai'
import { routesAtom } from '../functions/atom';
import { Popover, Button, Actionsheet, Box, useDisclose } from 'native-base';
import MarkerPopup from '../components/Marker';
import { background } from 'native-base/lib/typescript/theme/styled-system';
import { useNavigation } from '@react-navigation/native';

const baseUrl = 'https://data.police.uk/api';
const GOOGLE_MAPS_APIKEY = 'AIzaSyDyqPFPoJGT53p6-QosVbvV16MUwIL38Uo';

interface Coordinate {
  latitude: number,
  longitude: number
}

export default function TabOneScreen({}) {
  const h1Ref = useRef<MapView>(null);
	const navigation = useNavigation();

  const [isFirstVisit, setFirstVisit] = useState(true);
  const [crimes, initialCrimes] = useState<Crimes[]>([]);
  const [isRouteStart, setRouteStart] = useState(null)
  const [routes, onRoutesUpdate] = useAtom(routesAtom)

  const [delta, onDeltaChange] = useState({
		latitudeDelta: 0,
		longitudeDelta: 0
	});

  const [geometry, onGeometryChange] = useState({
    place_id: '', name: '', address: '',
    latitude: 50.9044082,
    longitude: -1.405594
	});

  const [destination, onDestinationChange] = useState({
    place_id: '', name: '', address: '',
    latitude: 50.9044082,
    longitude: -1.405594
	});

  const [centerGeometry, onCenterGeometryChange] = useState({
		latitude: 50.9044082,
		longitude: -1.405594
	});

  const [polyGeometry, onPolyGeometryChange] = useState([
		{ latitude: 50.9044082, longitude: -1.405594 },
  	{ latitude: 50.9044082, longitude: -1.405594 },
  	{ latitude: 50.9044082, longitude: -1.405594 },
  	{ latitude: 50.9044082, longitude: -1.405594 },
  	{ latitude: 50.9044082, longitude: -1.405594 },
  	{ latitude: 50.9044082, longitude: -1.405594 }
  ]);

  const [currentGeometry, onCurrentGeometryChange] = useState({
		latitude: 50.9044082,
		longitude: -1.405594
	});

  useLayoutEffect(() => {
    if (!h1Ref.current) return;

    h1Ref.current.animateToRegion({
      latitude: isFirstVisit ? currentGeometry.latitude : centerGeometry.latitude,
      longitude: isFirstVisit ? currentGeometry.longitude : centerGeometry.longitude,
      latitudeDelta: isFirstVisit ? 0.02 : delta.latitudeDelta,
      longitudeDelta: isFirstVisit ? 0.02 : delta.longitudeDelta,
    }, 2000)
  })

  useEffect(() => {
    let polyStr = '';
    if (polyGeometry.length == 1) {
      polyStr = '50.904784,-1.408083:50.90271,-1.403046:50.912051,-1.4029:50.913540,-1.397047';
    }
    else {
      polyGeometry.forEach((coordinate: Coordinate, index: number) => {
        polyStr = `${polyStr}${coordinate.latitude},${coordinate.longitude}`;
        if (index != polyGeometry.length-1) {
          polyStr = `${polyStr}:`;
        }
      });
    }

    console.log(polyStr);
    axios.get(`${baseUrl}/crimes-street/all-crime?poly=${polyStr}`)
        .then(response => {
          const crimes: Crimes[] = separateCrimeTypes(response.data);
          initialCrimes(crimes);
        });
  }, [polyGeometry]);

  useEffect(() => {
    onCenterGeometryChange({
      latitude: destination.latitude,
      longitude: destination.longitude
    });

    onDeltaChange({
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });

    console.log("=====")

    onPolyGeometryChange([
      {latitude: destination.latitude, longitude: destination.longitude - 0.005},
      {latitude: destination.latitude - 0.005, longitude: destination.longitude},
      {latitude: destination.latitude, longitude: destination.longitude + 0.005},
      {latitude: destination.latitude + 0.005, longitude: destination.longitude},
    ]);

    // axios.get(`${baseUrl}/crimes-street/all-crime?lat=${destination.latitude}&lng=${destination.longitude}`)
    // .then(response => {
    //   const crimes: Crimes[] = separateCrimeTypes(response.data);
    //   initialCrimes(crimes);
    // });
  }, [destination]);

  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  function getMapDirection(strokeColor: string, mode: MapViewDirectionsMode, waypoints: any[]) {
    return <MapViewDirections
      origin={currentGeometry}
      destination={isFirstVisit ? currentGeometry : geometry}
      apikey={GOOGLE_MAPS_APIKEY}
      waypoints={waypoints}
      strokeWidth={4}
      strokeColor={strokeColor}
      lineDashPattern={[4,4]}
      lineCap="round"
      mode={mode}
      optimizeWaypoints={true}
      onReady={result => {
        if (isFirstVisit) return;

        const deltaPerDist = 100;
        let ratioDist = result.distance/deltaPerDist;
        onDeltaChange({
          latitudeDelta: ratioDist,
          longitudeDelta: ratioDist
        })

        const centerIndex = Math.floor(result.coordinates.length/2);
        const centerCoordinates = result.coordinates[centerIndex];
        const originCoord = result.coordinates[0];
        const destinationCoord = result.coordinates[result.coordinates.length-1];

        ratioDist = Math.min(0.010, ratioDist);
        onPolyGeometryChange([
          {latitude: originCoord.latitude, longitude: originCoord.longitude + ratioDist/2},
          {latitude: centerCoordinates.latitude, longitude: centerCoordinates.longitude + ratioDist/2},
          {latitude: destinationCoord.latitude, longitude: destinationCoord.longitude + ratioDist/2},
          {latitude: destinationCoord.latitude, longitude: destinationCoord.longitude - ratioDist/2},
          {latitude: centerCoordinates.latitude, longitude: centerCoordinates.longitude - ratioDist/2},
          {latitude: originCoord.latitude, longitude: originCoord.longitude - ratioDist/2},
        ]);

        const centerLatFocus = (currentGeometry.latitude + geometry.latitude) / 2;
        const centerLngFocus = (currentGeometry.longitude + geometry.longitude) / 2;
        onCenterGeometryChange({
          latitude: centerLatFocus,
          longitude: centerLngFocus
        })
      }}
      onError={(errorMessage) => {
        console.log(errorMessage);
      }}
    />
  }

  const {
    isOpen,
    onOpen,
    onClose
  } = useDisclose();

  function openActionSheet() {
    return <Actionsheet isOpen={isBottomSheetVisible} onClose={() => {}} disableOverlay >
      <Actionsheet.Content>
          <DestinationPopup
            isBottomSheetVisible={isBottomSheetVisible}
            setBottomSheetVisible={setBottomSheetVisible}
            geometry={destination}
            navigation={navigation}
          ></DestinationPopup>
        </Actionsheet.Content>
      </Actionsheet>
  }

  return (
    <View style={styles.container}>
      <GooglePlacesInput onDestinationChange={onDestinationChange} isDestinationChanged={setBottomSheetVisible} isFirstVisited={setFirstVisit}/>

      <MapView region={{... isFirstVisit ? currentGeometry : centerGeometry, latitudeDelta: delta.latitudeDelta, longitudeDelta: delta.longitudeDelta}}
        style={{margin: 0, height: '100%', width: '100%'}}
        showsUserLocation={true}
        provider={PROVIDER_GOOGLE}
        ref={h1Ref}
        onUserLocationChange={(e: EventUserLocation) => {
          const lat = e.nativeEvent.coordinate.latitude;
          const lng = e.nativeEvent.coordinate.longitude;
          if (lat.toFixed(3) == currentGeometry.latitude.toFixed(3) ||
          lng.toFixed(3) == currentGeometry.longitude.toFixed(3)) return;

          onCurrentGeometryChange({
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude
          })
        }}
        >
        <Marker key={1000} coordinate={currentGeometry} />
        <Marker key={2000} coordinate={isFirstVisit ? currentGeometry : {
          latitude: destination.latitude,
          longitude: destination.longitude
        }} />

        {destination ? openActionSheet() : <></>}

        {crimes.map((crimeTypes: Crimes, index) => (
          crimeTypes.crimes.map((crime: Crime, d) => {
            return <Marker
                key={index + d}
                coordinate={{
                  latitude: parseFloat(crime.latitude),
                  longitude: parseFloat(crime.longitude),
                }}
                onPress={() => { onOpen() }}
                pinColor={crimeTypes.icon}
            >
              <Callout
                tooltip
                style={{ borderRadius: 20}}>
                <View style={styles.bubble}>
                  <View style={{width: 45, height: 45, backgroundColor: "#eee", borderRadius: 50, marginRight: 10 }}></View>
                  <View>
                    <Text style={{fontSize: 16, marginBottom: 5, textTransform: 'capitalize', fontWeight: '500'}}>{crimeTypes.category}</Text>
                    <Text>Location: {crime.location} location of crime ocurred</Text>
                    <Text>Date: {crime.dateTime}</Text>
                  </View>
                </View>
              </Callout>
          </Marker>
          })
        ))}

        {isRouteStart ? getMapDirection("grey", 'BICYCLING', []) : <></>}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 20
  },
  modal: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    marginTop: 10,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  modalSubTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButton: {
    fontSize: 16
  },
  getStartedText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: '80%',
  },
});
