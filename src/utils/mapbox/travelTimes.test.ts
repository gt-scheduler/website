import { getDistanceBetweenLocations, batchGetDistances } from './travelTimes';

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variable
const originalEnv = process.env['REACT_APP_MAPBOX_TOKEN'];

describe('Travel Times', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    process.env['REACT_APP_MAPBOX_TOKEN'] = 'mock-token';
  });

  afterAll(() => {
    if (originalEnv) {
      process.env['REACT_APP_MAPBOX_TOKEN'] = originalEnv;
    } else {
      delete process.env['REACT_APP_MAPBOX_TOKEN'];
    }
  });
  test('should return 0 for same location', async () => {
    const loc = { lat: 33.773568, long: -84.395957 };
    const result = await getDistanceBetweenLocations(loc, loc);
    expect(result).toBe(0);
  });

  test('should return matrix value for GT locations', async () => {
    const skiles = { lat: 33.773568, long: -84.395957 };
    const clough = { lat: 33.774909, long: -84.396404 };
    const result = await getDistanceBetweenLocations(skiles, clough);
    expect(result).toBeCloseTo(227.9, 1);
  });

  test('should handle invalid coordinates', async () => {
    const invalidLoc = { lat: NaN, long: -84.395957 };
    const validLoc = { lat: 33.773568, long: -84.395957 };
    const result = await getDistanceBetweenLocations(invalidLoc, validLoc);
    expect(result).toBeNull();
  });

  test('should return empty map for single location', async () => {
    const locations = [{ lat: 33.773568, long: -84.395957 }];
    const result = await batchGetDistances(locations);
    expect(result.size).toBe(0);
  });

  test('should calculate travel times for multiple locations', async () => {
    const skiles = { lat: 33.773568, long: -84.395957 };
    const clough = { lat: 33.774909, long: -84.396404 };
    const boggs = { lat: 33.776085, long: -84.400181 };

    const result = await batchGetDistances([skiles, clough, boggs]);

    expect(result.size).toBe(2); // 2 pairs: skiles->clough, clough->boggs
  });

  test('should use Directions API fallback for custom locations', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => ({
        code: 'Ok',
        routes: [{ duration: 300 }],
      }),
    });

    // Use coordinates that are NOT in the GT_DISTANCE_MATRIX
    const customLoc1 = { lat: 33.75, long: -84.4 }; // Custom location
    const customLoc2 = { lat: 33.76, long: -84.41 }; // Custom location

    const result = await getDistanceBetweenLocations(customLoc1, customLoc2);

    // Should return a valid duration (not null) from Directions API
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('should handle Directions API errors gracefully', async () => {
    // Mock fetch to simulate API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const customLoc1 = { lat: 33.75, long: -84.4 };
    const customLoc2 = { lat: 33.76, long: -84.41 };

    const result = await getDistanceBetweenLocations(customLoc1, customLoc2);

    // Should return null when API fails
    expect(result).toBeNull();
  });

  test('should handle mixed GT and custom locations', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => ({
        code: 'Ok',
        routes: [{ duration: 250 }],
      }),
    });

    const skiles = { lat: 33.773568, long: -84.395957 }; // GT location (in matrix)
    const customLoc = { lat: 33.75, long: -84.4 }; // Custom location (not in matrix)

    const result = await getDistanceBetweenLocations(skiles, customLoc);

    // Should use Directions API fallback and return valid duration
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('should prefer matrix over Directions API for GT locations', async () => {
    const skiles = { lat: 33.773568, long: -84.395957 };
    const clough = { lat: 33.774909, long: -84.396404 };

    const result = await getDistanceBetweenLocations(skiles, clough);

    // Should return matrix value without calling Directions API
    expect(result).toBeCloseTo(227.9, 1);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
