import { Camera, Map, Marker, ViewAnnotation, type CameraRef, type LngLat } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HouseEditor } from './src/HouseEditor';
import { listHouses, openHouseDatabase, saveHouse, type House, type HouseDetails } from './src/houses';

const mapStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim()
  || 'https://tiles.openfreemap.org/styles/liberty';
const emptyMapStyle = {
  version: 8 as const,
  sources: {},
  layers: [{ id: 'background', type: 'background' as const, paint: { 'background-color': '#dce5dc' } }],
};
const defaultCenter: LngLat = [5.1214, 52.0907];

type Editor = { coordinate: LngLat; house?: House };
type Project = { db: SQLiteDatabase; houses: House[] };

function Reflo({ db, houses: savedHouses }: Project) {
  const [houses, setHouses] = useState(savedHouses);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [adding, setAdding] = useState(false);
  const [basemapUnavailable, setBasemapUnavailable] = useState(false);
  const [position, setPosition] = useState<LngLat | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [offerSettings, setOfferSettings] = useState(false);
  const locationPending = useRef(false);
  const camera = useRef<CameraRef>(null);
  const [initialView] = useState(() => {
    const house = savedHouses[0];
    return house
      ? { center: [house.longitude, house.latitude] as LngLat, zoom: 15 }
      : { center: defaultCenter, zoom: 12 };
  });

  function addHouse(coordinate: LngLat) {
    setAdding(false);
    setEditor({ coordinate });
  }

  function editHouse(house: House) {
    const coordinate: LngLat = [house.longitude, house.latitude];
    setAdding(false);
    camera.current?.easeTo({ center: coordinate, zoom: 15, duration: 250 });
    setEditor({ coordinate, house });
  }

  async function save(details: HouseDetails) {
    if (!editor) return;
    const [longitude, latitude] = editor.coordinate;
    const house = await saveHouse(db, { longitude, latitude }, details, editor.house?.id);
    setHouses((current) => editor.house
      ? current.map((existing) => existing.id === house.id ? house : existing)
      : [house, ...current]);
    setEditor(null);
  }

  function showDownloadStatus() {
    Alert.alert(
      'Area download unavailable',
      'Pan and zoom to choose the area you want. Reflo cannot download it yet because its map downloader cannot enforce OpenFreeMap’s request and size limits or identify downloads as Reflo.',
    );
  }

  async function findMyLocation() {
    if (locationPending.current) return;
    locationPending.current = true;
    setLocating(true);
    setPosition(null);
    setLocationMessage('');
    setOfferSettings(false);

    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setOfferSettings(!permission.canAskAgain);
        setLocationMessage(permission.canAskAgain
          ? 'Location permission denied. Tap My location to try again.'
          : 'Allow location access in app settings, then try again.');
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) {
        setLocationMessage('Location services are off. Turn on Location in Android settings, then try again.');
        return;
      }

      const approximate = permission.android?.accuracy === 'coarse';
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: approximate ? Location.Accuracy.Balanced : Location.Accuracy.High,
        mayShowUserSettingsDialog: false,
      });
      const coordinate: LngLat = [coords.longitude, coords.latitude];
      setPosition(coordinate);
      setLocationMessage(approximate ? 'Approximate location' : '');
      camera.current?.easeTo({ center: coordinate, zoom: approximate ? 12 : 15, duration: 400 });
    } catch {
      setLocationMessage('Could not get a location. Try again when you have a clearer view of the sky.');
    } finally {
      locationPending.current = false;
      setLocating(false);
    }
  }

  return (
    <>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.brand}>Reflo</Text>
        <Pressable accessibilityRole="button" style={styles.download} onPress={showDownloadStatus}>
          <Text style={styles.actionText}>Download this area</Text>
        </Pressable>
      </View>
      <View style={styles.mapPanel}>
        <Map
          style={StyleSheet.absoluteFill}
          mapStyle={basemapUnavailable ? emptyMapStyle : mapStyleUrl}
          attribution
          androidView="texture"
          onDidFailLoadingMap={() => setBasemapUnavailable(true)}
          onLongPress={({ nativeEvent }) => addHouse(nativeEvent.lngLat)}
          onPress={({ nativeEvent }) => {
            if (adding) addHouse(nativeEvent.lngLat);
          }}
        >
          <Camera ref={camera} initialViewState={initialView} />
          {position ? (
            <ViewAnnotation id="current-location" lngLat={position}>
              <View pointerEvents="none" style={styles.locationMarker}>
                <View style={styles.locationDot} />
              </View>
            </ViewAnnotation>
          ) : null}
          {houses.map((house) => (
            <Marker
              key={house.id}
              lngLat={[house.longitude, house.latitude]}
              accessibilityLabel={house.name}
              accessibilityRole="button"
              onPress={() => editHouse(house)}
            >
              <View style={styles.marker}><View style={styles.markerDot} /></View>
            </Marker>
          ))}
        </Map>
        {basemapUnavailable ? (
          <Pressable accessibilityRole="button" style={styles.notice} onPress={() => setBasemapUnavailable(false)}>
            <Text style={styles.actionText}>Basemap unavailable · Retry</Text>
          </Pressable>
        ) : null}
        <View style={styles.mapActions}>
          {locationMessage ? (
            <View style={styles.locationNotice}>
              <Text accessibilityLiveRegion="polite" style={styles.actionText}>{locationMessage}</Text>
              {offerSettings ? (
                <Pressable accessibilityRole="button" style={styles.settings} onPress={() => {
                  void Linking.openSettings().catch(() => {
                    setLocationMessage('Open Reflo’s app settings manually to allow location access.');
                  });
                }}>
                  <Text style={styles.actionText}>Open app settings</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {adding ? <Text style={styles.hint}>Tap the map to place a house.</Text> : null}
          <View style={styles.mapButtons}>
            <Pressable accessibilityRole="button" style={styles.primary} onPress={() => setAdding(!adding)}>
              <Text style={styles.primaryText}>{adding ? 'Cancel' : '+ Drop a pin'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="My location"
              accessibilityState={{ disabled: locating, busy: locating }} disabled={locating}
              style={styles.locationButton} onPress={findMyLocation}>
              {locating ? <ActivityIndicator size="small" color="#164c8d" /> : null}
              <Text accessibilityLiveRegion="polite" style={styles.actionText}>
                {locating ? 'Finding location…' : 'My location'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.listPanel}>
        <Text accessibilityRole="header" style={styles.listTitle}>Saved houses</Text>
        <FlatList
          data={houses}
          keyExtractor={(house) => String(house.id)}
          ListEmptyComponent={<Text style={styles.secondary}>Drop a pin or press and hold on the map to save a house.</Text>}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" style={styles.row} onPress={() => editHouse(item)}>
              <View style={styles.rowText}>
                <Text style={styles.houseName}>{item.name}</Text>
                <Text style={styles.secondary}>
                  {item.accessScore === null ? 'Access road unknown' : item.accessScore === 0
                    ? '0/10 · No access road' : `Access road · ${item.accessScore}/10`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      </View>
      {editor ? <HouseEditor house={editor.house} onClose={() => setEditor(null)} onSave={save} /> : null}
    </>
  );
}

let projectPromise: Promise<Project> | undefined;
function loadProject() {
  projectPromise ??= (async () => {
    const db = await openHouseDatabase();
    try {
      return { db, houses: await listHouses(db) };
    } catch (error) {
      await db.closeAsync();
      throw error;
    }
  })();
  return projectPromise;
}

export default function App() {
  const [project, setProject] = useState<Project>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadProject().then(
      (result) => { if (active) setProject(result); },
      () => {
        projectPromise = undefined;
        if (active) setLoadFailed(true);
      },
    );
    return () => { active = false; };
  }, [attempt]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        {project ? <Reflo {...project} /> : (
          <View style={styles.center}>
            {loadFailed ? (
              <>
                <Text style={styles.secondary}>Could not open saved houses.</Text>
                <Pressable accessibilityRole="button" style={styles.primary} onPress={() => {
                  setLoadFailed(false);
                  setAttempt(attempt + 1);
                }}>
                  <Text style={styles.primaryText}>Retry</Text>
                </Pressable>
              </>
            ) : <ActivityIndicator accessibilityLabel="Loading saved houses" color="#1b543e" />}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f7f2' },
  header: { paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brand: { color: '#17392d', fontSize: 32, fontWeight: '800' },
  download: { padding: 12, borderRadius: 10, backgroundColor: '#e5ede5' },
  actionText: { color: '#23493b', fontWeight: '700' },
  mapPanel: { flex: 3, backgroundColor: '#dce5dc' },
  notice: { position: 'absolute', top: 44, alignSelf: 'center', padding: 10, backgroundColor: '#fff', borderRadius: 8 },
  mapActions: { position: 'absolute', left: 14, bottom: 18, alignItems: 'flex-start', gap: 6 },
  mapButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: '#fff' },
  locationNotice: { maxWidth: 260, padding: 10, borderRadius: 8, backgroundColor: '#fff' },
  settings: { alignSelf: 'flex-start', paddingVertical: 10 },
  locationMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#255fc655', alignItems: 'center', justifyContent: 'center' },
  locationDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff', backgroundColor: '#164c8d' },
  hint: { padding: 9, borderRadius: 8, color: '#17392d', backgroundColor: '#fff' },
  primary: { backgroundColor: '#1b543e', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  marker: { width: 27, height: 27, borderRadius: 14, borderWidth: 3, borderColor: '#fff', backgroundColor: '#1b543e', alignItems: 'center', justifyContent: 'center' },
  markerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  listPanel: { flex: 2, paddingHorizontal: 20, paddingTop: 12 },
  listTitle: { color: '#17392d', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  secondary: { color: '#475951', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomColor: '#d8e0d8', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 11 },
  rowText: { flex: 1, gap: 2 },
  houseName: { color: '#17392d', fontSize: 17, fontWeight: '700' },
  chevron: { color: '#1b543e', fontSize: 26 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
