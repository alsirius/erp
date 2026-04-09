import { Endpoint, CreateEndpointDto, UpdateEndpointDto } from '../../types';
import { SQLiteDAO } from '../GenericDAO';
import { Database } from 'better-sqlite3';

export class EndpointDAO extends SQLiteDAO<Endpoint, CreateEndpointDto, UpdateEndpointDto> {
  constructor(db: Database) {
    super('endpoints', db);
    this.idField = 'id';
  }

  protected mapRowToEntity(row: any): Endpoint {
    return {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      is24Hour: Boolean(row.is_24_hour),
      isLgScreen: Boolean(row.is_lg_screen),
      cpmFloorCents: row.cpm_floor_cents ? Number(row.cpm_floor_cents) : undefined,
      impressionsPerSpot: row.impressions_per_spot ? Number(row.impressions_per_spot) : undefined,
      onboardingComplete: Boolean(row.onboarding_complete),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deleted: Number(row.deleted)
    };
  }

  protected validateCreateData(data: CreateEndpointDto): void {
    if (!data.id) throw new Error('Endpoint ID is required');
    if (!data.name) throw new Error('Name is required');
  }

  protected validateUpdateData(data: UpdateEndpointDto): void {
    // Basic validation
  }

  protected getInsertFields(): string[] {
    return [
      'id', 'name', 'address', 'latitude', 'longitude', 'screen_type',
      'venue_type_id', 'vistar_venue_group_id', 'venue_hours_open', 'venue_hours_close',
      'is_24_hour', 'is_lg_screen', 'poc_email', 'created_at', 'updated_at', 'deleted',
      'validation_status', 'vistar_status', 'onboarding_complete'
    ];
  }

  protected getUpdateFields(): string[] {
    return [
      'name', 'address', 'latitude', 'longitude', 'screen_type',
      'venue_type_id', 'vistar_venue_group_id', 'venue_hours_open', 'venue_hours_close',
      'is_24_hour', 'is_lg_screen', 'poc_email', 'updated_at',
      'validation_status', 'vistar_status', 'onboarding_complete'
    ];
  }

  async migrate(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS endpoints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        screen_type TEXT NOT NULL,
        venue_type_id INTEGER NOT NULL,
        vistar_venue_group_id TEXT NOT NULL,
        venue_hours_open TEXT,
        venue_hours_close TEXT,
        is_24_hour INTEGER DEFAULT 0,
        is_lg_screen INTEGER DEFAULT 0,
        poc_email TEXT,
        cpm_floor_cents INTEGER,
        impressions_per_spot REAL,
        operating_minutes TEXT,
        cortex_supported INTEGER,
        validation_status TEXT DEFAULT 'pending',
        validation_errors TEXT,
        vistar_venue_id TEXT,
        vistar_status TEXT DEFAULT 'pending',
        dropbox_folder_url TEXT,
        dropbox_status TEXT DEFAULT 'pending',
        hivestack_status TEXT DEFAULT 'pending',
        broadsign_status TEXT DEFAULT 'pending',
        onboarding_complete INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted INTEGER DEFAULT 0
      )
    `;
    this.db.exec(query);
  }
}
