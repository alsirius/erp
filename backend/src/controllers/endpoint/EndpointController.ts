import { Request, Response } from 'express';
import { EndpointService } from '../../services/endpoint/EndpointService';
import { ApiResponse } from '../../types';
import { QueryRequest } from '../../types/api';

export class EndpointController {
  constructor(private endpointService: EndpointService) {}

  async create(req: Request, res: Response) {
    const result = await this.endpointService.createEndpoint(req.body);
    if (!result.success) {
      return res.status(result.error?.statusCode || 500).json({ success: false, error: result.error?.message });
    }
    return res.status(201).json({ success: true, data: result.data });
  }

  async getById(req: Request, res: Response) {
    const result = await this.endpointService.getEndpointById(req.params.id);
    if (!result.success) {
      return res.status(result.error?.statusCode || 500).json({ success: false, error: result.error?.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  }

  async list(req: Request, res: Response) {
    const query: QueryRequest = {
      pagination: {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      },
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
      sort: req.query.sort ? JSON.parse(req.query.sort as string) : { updated_at: 'desc' }
    };

    const result = await this.endpointService.listEndpoints(query);
    if (!result.success) {
      return res.status(result.error?.statusCode || 500).json({ success: false, error: result.error?.message });
    }
    return res.status(200).json({ success: true, data: result.data?.items, pagination: result.data?.pagination });
  }

  async update(req: Request, res: Response) {
    const result = await this.endpointService.updateEndpoint(req.params.id, req.body);
    if (!result.success) {
      return res.status(result.error?.statusCode || 500).json({ success: false, error: result.error?.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  }

  async delete(req: Request, res: Response) {
    const result = await this.endpointService.deleteEndpoint(req.params.id);
    if (!result.success) {
      return res.status(result.error?.statusCode || 500).json({ success: false, error: result.error?.message });
    }
    return res.status(200).json({ success: true, data: true });
  }
}
