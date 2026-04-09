import { Endpoint, CreateEndpointDto, UpdateEndpointDto } from '../../types';
import { SnowflakeDAO } from '../GenericDAO';
import { RequestContext } from '../../types/api';

export class SnowflakeEndpointDAO extends SnowflakeDAO<Endpoint, CreateEndpointDto, UpdateEndpointDto> {
  constructor(queryExecutor: (sql: string, binds?: any[]) => Promise<any[]>) {
    super('STAGING.PENDING_ENDPOINTS', queryExecutor);
    this.idField = 'ENDPOINT_ID';
  }

  protected mapRowToEntity(row: any): Endpoint {
    return {
      id: row.ENDPOINT_ID,
      name: row.NAME,
      address: row.ADDRESS,
      latitude: Number(row.LATITUDE),
      longitude: Number(row.LONGITUDE),
      screenType: row.SCREEN_TYPE as any,
      venueTypeId: Number(row.VENUE_TYPE_ID),
      vistarVenueGroupId: row.VISTAR_VENUE_GROUP_ID,
      venueHoursOpen: row.VENUE_HOURS_OPEN,
      venueHoursClose: row.VENUE_HOURS_CLOSE,
      is24Hour: Boolean(row.IS_24_HOUR),
      isLgScreen: Boolean(row.IS_LG_SCREEN),
      pocEmail: row.POC_EMAIL,
      validationStatus: (row.VALIDATION_STATUS || 'pending') as any,
      vistarStatus: (row.VISTAR_STATUS || 'pending') as any,
      dropboxStatus: (row.DROPBOX_STATUS || 'pending') as any,
      hivestackStatus: (row.HIVESTACK_STATUS || 'pending') as any,
      broadsignStatus: (row.BROADSIGN_STATUS || 'pending') as any,
      onboardingComplete: Boolean(row.ONBOARDING_COMPLETE),
      createdAt: new Date(row.CREATED_AT),
      updatedAt: new Date(row.UPDATED_AT),
      deleted: Number(row.DELETED || 0)
    };
  }

  // Map incoming camel/snake case data to Snowflake UPPERCASE columns
  private transformData(data: any): any {
    return {
      ENDPOINT_ID: data.id,
      NAME: data.name,
      ADDRESS: data.address,
      LATITUDE: data.latitude,
      LONGITUDE: data.longitude,
      SCREEN_TYPE: data.screen_type || data.screenType,
      VENUE_TYPE_ID: data.venue_type_id || data.venueTypeId,
      VISTAR_VENUE_GROUP_ID: data.vistar_venue_group_id || data.vistarVenueGroupId,
      VENUE_HOURS_OPEN: data.venue_hours_open || data.venueHoursOpen,
      VENUE_HOURS_CLOSE: data.venue_hours_close || data.venueHoursClose,
      IS_24_HOUR: (data.is_24_hour || data.is24Hour) ? 1 : 0,
      IS_LG_SCREEN: (data.is_lg_screen || data.isLgScreen) ? 1 : 0,
      POC_EMAIL: data.poc_email || data.pocEmail,
      VALIDATION_STATUS: data.validation_status || data.validationStatus || 'pending',
      VISTAR_STATUS: data.vistar_status || data.vistarStatus || 'pending',
      ONBOARDING_COMPLETE: (data.onboarding_complete || data.onboardingComplete) ? 1 : 0,
      CREATED_AT: data.created_at || data.createdAt || new Date().toISOString(),
      UPDATED_AT: data.updated_at || data.updatedAt || new Date().toISOString(),
      DELETED: data.deleted || 0
    };
  }

  async create(data: CreateEndpointDto, context?: RequestContext): Promise<Endpoint> {
    const transformed = this.transformData(data);
    const result = await super.create(transformed, context);
    return this.mapRowToEntity(result); // result from super.create (transformed)
  }

  async update(id: string, data: UpdateEndpointDto, context?: RequestContext): Promise<Endpoint> {
    const transformed = this.transformData(data);
    // Remove undefined fields so they aren't part of the UPDATE SET clause
    Object.keys(transformed).forEach(key => {
        if (transformed[key] === undefined) delete transformed[key];
    });
    const result = await super.update(id, transformed, context);
    return this.mapRowToEntity(result);
  }

  protected validateCreateData(data: any): void {
    // Overriding because data here is already transformed or being transformed
    if (!data.ENDPOINT_ID && !data.id) throw new Error('Endpoint ID is required');
  }

  protected validateUpdateData(data: any): void {
    // Basic validation
  }

  protected getInsertFields(): string[] {
    return [
      'ENDPOINT_ID', 'NAME', 'ADDRESS', 'LATITUDE', 'LONGITUDE', 'SCREEN_TYPE',
      'VENUE_TYPE_ID', 'VISTAR_VENUE_GROUP_ID', 'VENUE_HOURS_OPEN', 'VENUE_HOURS_CLOSE',
      'IS_24_HOUR', 'IS_LG_SCREEN', 'POC_EMAIL', 'CREATED_AT', 'UPDATED_AT',
      'VALIDATION_STATUS', 'VISTAR_STATUS', 'ONBOARDING_COMPLETE', 'DELETED'
    ];
  }

  protected getUpdateFields(): string[] {
    return [
      'NAME', 'ADDRESS', 'LATITUDE', 'LONGITUDE', 'SCREEN_TYPE',
      'VENUE_TYPE_ID', 'VISTAR_VENUE_GROUP_ID', 'VENUE_HOURS_OPEN', 'VENUE_HOURS_CLOSE',
      'IS_24_HOUR', 'IS_LG_SCREEN', 'POC_EMAIL', 'UPDATED_AT',
      'VALIDATION_STATUS', 'VISTAR_STATUS', 'ONBOARDING_COMPLETE'
    ];
  }
}
