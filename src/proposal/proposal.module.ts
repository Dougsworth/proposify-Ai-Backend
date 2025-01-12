import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { GeneratePdfService } from './generate-pdf.service';

@Module({
  providers: [ProposalService, GeneratePdfService],
  controllers: [ProposalController],
})
export class ProposalModule {}
