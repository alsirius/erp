import { Endpoint, CreateEndpointDto, UpdateEndpointDto, ServiceResponse } from '../../types';
import { QueryRequest, ListResponse } from '../../types/api';
import { IGenericDAO } from '../../dao/GenericDAO';

export class EndpointService {
  constructor(private endpointDao: IGenericDAO<Endpoint, CreateEndpointDto, UpdateEndpointDto>) {}

  async createEndpoint(data: CreateEndpointDto): Promise<ServiceResponse<Endpoint>> {
    try {
      // Internal Validation
      if (!data.id || !data.name) {
        return { success: false, error: { code: 'INVALID_DATA', message: 'ID and Name are required', statusCode: 400 } };
      }

      const now = new Date();
      const endpointData: any = {
        id: data.id,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        screen_type: data.screenType,
        venue_type_id: data.venueTypeId,
        vistar_venue_group_id: data.vistarVenueGroupId,
        venue_hours_open: data.venueHoursOpen,
        venue_hours_close: data.venueHoursClose,
        is_24_hour: data.is24Hour ? 1 : 0,
        is_lg_screen: data.isLgScreen ? 1 : 0,
        poc_email: data.pocEmail,
        validation_status: 'pending',
        vistar_status: 'pending',
        onboarding_complete: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        deleted: 0
      };

      // Mock automated calculations from specs
      if (data.screenType === 'inside') {
        endpointData.cpm_floor_cents = 500;
        endpointData.impressions_per_spot = 5.0;
      } else {
        endpointData.cpm_floor_cents = 575; // Default for outside
        endpointData.impressions_per_spot = 10.0;
      }

      const created = await this.endpointDao.create(endpointData);
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message, statusCode: 500 } };
    }
  }

  async getEndpointById(id: string): Promise<ServiceResponse<Endpoint>> {
    try {
      const endpoint = await this.endpointDao.findById(id);
      if (!endpoint) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found', statusCode: 404 } };
      }
      return { success: true, data: endpoint };
    } catch (error) {
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message, statusCode: 500 } };
    }
  }

  async listEndpoints(query?: QueryRequest): Promise<ServiceResponse<ListResponse<Endpoint>>> {
    try {
      const result = await this.endpointDao.findAll(query);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message, statusCode: 500 } };
    }
  }

  async updateEndpoint(id: string, data: UpdateEndpointDto): Promise<ServiceResponse<Endpoint>> {
    try {
      const existing = await this.endpointDao.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found', statusCode: 404 } };
      }

      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      };

      if (data.screenType !== undefined) updateData.screen_type = data.screenType;
      if (data.venueTypeId !== undefined) updateData.venue_type_id = data.venueTypeId;
      if (data.vistarVenueGroupId !== undefined) updateData.vistar_venue_group_id = data.vistarVenueGroupId;
      if (data.venueHoursOpen !== undefined) updateData.venue_hours_open = data.venueHoursOpen;
      if (data.venueHoursClose !== undefined) updateData.venue_hours_close = data.venueHoursClose;
      if (data.is24Hour !== undefined) updateData.is_24_hour = data.is24Hour ? 1 : 0;
      if (data.isLgScreen !== undefined) updateData.is_lg_screen = data.isLgScreen ? 1 : 0;
      if (data.pocEmail !== undefined) updateData.poc_email = data.pocEmail;

      const updated = await this.endpointDao.update(id, updateData);
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message, statusCode: 500 } };
    }
  }

  async deleteEndpoint(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await this.endpointDao.delete(id);
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message, statusCode: 500 } };
    }
  }
}
