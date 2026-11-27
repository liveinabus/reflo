Reflo — High-level requirements v0.1
Purpose
Reflo is a mobile-first map workspace for saving places, linking evidence to them, and comparing options before making a decision. The first use case is choosing which houses for sale to visit and recording what you find on site.

The web app will live at https://www.reflo.nl. Android is the first offline mobile target. iPhone follows after the Android field workflow is proven.
First release — House visits
1. Save a house. Drop a pin or enter coordinates, give it a name, and attach the listing URL. Record the visit status as Shortlisted, To visit, Visited, or Ruled out.
2. Find and compare houses. Show the same saved houses in a map and a list. Filter both by visit status and minimum access-road score. Show unrated properties explicitly, with an option to include them.
3. Review a house. Add free-text notes and score predefined review items. Start with access road on a 0–10 scale. Use 0 for no road access, 5 for an accessible unpaved road, and 10 for a fully paved road with lighting and trees. Leave unknown scores blank. Keep measured route restrictions separate from the subjective score.
4. Prepare for offline visits. While connected, make a selected area's basemap and saved houses available on Android. Show when the area is ready. In airplane mode, reopen Reflo, view the downloaded map and houses, use the filters, and add or edit pins, notes, statuses, and scores. Edits must survive closing and reopening the app. Show download coverage so users can tell where map detail is available.
5. Keep the web and phone records together. In the first release, use a private personal workspace. Once connected, sync edits between Android and web without duplicates or silent loss of conflicting edits. Show whether changes are pending or synced.
Data and maps
Start with a reusable Place record containing a stable ID, type, name and coordinates. Link listing URLs, notes and reviews to it. Keep review criteria configurable in the data model so later place types can use different questions. Geographic evidence can eventually apply to a point, an area, or a road segment.

Use OpenStreetMap data and evaluate Mapbox for rendering and downloadable map coverage. Validate regional offline downloads, attribution and provider terms in the Android prototype before committing to the map setup. Plan to combine suitable providers as new map and data needs emerge.
Later capabilities
Capability	High-level requirement
Find places by map filters	Search within a selected area using external map and dataset filters, then save matching places. Start the first release with filtering saved houses.
Tourism analysis	Link historical visitor or overnight-stay figures and nearby tourism providers to a location. Keep source, geographic coverage, period and update date visible so trends can be compared at the appropriate scale.
Agriculture analysis	Link crop and supply data where available. Assess possible shortages using separate demand and supply evidence, and label evidence gaps.
Vehicle-aware navigation	Plan and eventually navigate routes using vehicle height, width, length and weight. Flag missing or uncertain restriction coverage and make it visible in route results.
Assistant integration	Give ChatGPT scoped access to search places, reviews and linked datasets through a backend API. Consider MCP once there is a concrete assistant workflow. Add writes only with explicit user control.
iPhone	Bring the proven offline field workflow to iPhone and validate map downloads and durable offline edits there.


Where to start
Build a narrow Android proof of concept using one actual house-search area and three to five listings. Use a map, a short list, and a review form with just notes and the access-road score. Test the hardest requirement early by downloading the area, switching to airplane mode, reopening the app, and recording a review at a house. Then add the web view and sync to turn that prototype into the first release.

Keep the Android delivery choice open until the offline test. Evaluate how reliably the app reopens, retains maps and edits, and works with the chosen map provider. Use a local-first approach so recording a visit works whenever the phone has no connection.