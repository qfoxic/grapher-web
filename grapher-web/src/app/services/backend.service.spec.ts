import { TestBed, inject } from '@angular/core/testing';
import { GrapherService } from './backend.service';

describe('GrapherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GrapherService]
    });
  });

  it('should be created', inject([GrapherService], (service: GrapherService) => {
    expect(service).toBeTruthy();
  }));
});
