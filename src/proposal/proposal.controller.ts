import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  ForbiddenException,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { GeneratePdfService } from './generate-pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import { Res } from '@nestjs/common';

import {
  ProposalService,
  CreateProposalData,
  GenerateProposalData,
} from './proposal.service';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs with class-validator decorators for runtime validation
class SectionDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsNumber()
  order: number;
}

class RegenerateSectionDto {
  @IsString()
  sectionTitle: string;

  @IsString()
  currentContent: string;

  @IsString()
  proposalTitle: string;

  @IsString()
  sectionType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionContextDto)
  context: SectionContextDto[];
}

class SectionContextDto {
  @IsString()
  title: string;

  @IsString()
  content: string;
}

class CreateProposalDto implements CreateProposalData {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => SectionDto)
  sections: SectionDto[];
}

class UpdateSectionOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => SectionUpdateDto)
  sectionUpdates: { id: number; order: number }[];
}

class SectionUpdateDto {
  @IsNumber()
  id: number;

  @IsNumber()
  order: number;
}

class GenerateProposalDto implements GenerateProposalData {
  @IsString()
  businessDescription: string;

  @IsString()
  industry: string;

  @IsString()
  targetAudience: string;
}

// Simple DTO for basic proposal creation
class SimpleProposalDto {
  @IsString()
  title: string;
}

@Controller('proposal')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ProposalController {
  constructor(
    private readonly proposalService: ProposalService,
    private readonly generatePdfService: GeneratePdfService,
  ) {}

  // New endpoint for simple proposal creation
  @Post()
  async createSimpleProposal(@Body() data: SimpleProposalDto, @Req() req) {
    try {
      const userId = req.user.userId;
      return await this.proposalService.createProposal(userId, {
        title: data.title,
        sections: [
          {
            title: 'Introduction',
            content: 'New proposal content',
            order: 0,
          },
        ],
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to create proposal: ${error.message}`,
      );
    }
  }

  @Post('create')
  async createProposal(@Body() data: CreateProposalDto, @Req() req) {
    try {
      const userId = req.user.userId;
      return await this.proposalService.createProposal(userId, data);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create proposal: ${error.message}`,
      );
    }
  }

  @Get()
  async getProposals(@Req() req) {
    try {
      const userId = req.user.userId;
      return await this.proposalService.getUserProposals(userId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch proposals: ${error.message}`,
      );
    }
  }

  @Get(':id')
  async getProposal(@Param('id', ParseIntPipe) id: number, @Req() req) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(id, userId);
      return await this.proposalService.getProposalWithSections(id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch proposal: ${error.message}`,
      );
    }
  }

  @Patch(':id/sections')
  async updateProposalSections(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { sections: SectionDto[] },
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(id, userId);
      return await this.proposalService.updateProposalSections(
        id,
        data.sections,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update sections: ${error.message}`,
      );
    }
  }

  @Patch(':id/reorder')
  async updateSectionOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSectionOrderDto,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(id, userId);
      return await this.proposalService.updateSectionOrder(
        id,
        data.sectionUpdates,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to reorder sections: ${error.message}`,
      );
    }
  }

  @Get(':id/version/:version')
  async getProposalVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('version', ParseIntPipe) version: number,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(id, userId);
      return await this.proposalService.getProposalVersion(id, version);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch version: ${error.message}`,
      );
    }
  }

  @Post(':id/template')
  async saveAsTemplate(@Param('id', ParseIntPipe) id: number, @Req() req) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(id, userId);
      return await this.proposalService.saveAsTemplate(id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save template: ${error.message}`,
      );
    }
  }
  @Post(':id/generate-pdf')
  async generatePdf(
    @Param('id') id: number,
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(id, userId);

      // Fetch the proposal details
      const proposal = await this.proposalService.getProposalWithSections(id);

      // Generate the PDF
      const pdfBuffer = await this.generatePdfService.createPdf(proposal);

      // Set response headers for file download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${proposal.title}.pdf"`,
      });

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException(`Failed to generate PDF: ${error.message}`);
    }
  }

  @Post('generate')
  async generateProposal(@Body() data: GenerateProposalDto, @Req() req) {
    try {
      const userId = req.user.userId;
      return await this.proposalService.generateInitialProposal(userId, data);
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate proposal: ${error.message}`,
      );
    }
  }

  @Post(':id/sections/:sectionId/regenerate')
  async regenerateSection(
    @Param('id', ParseIntPipe) proposalId: number,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() data: RegenerateSectionDto,
    @Req() req,
  ) {
    try {
      const userId = req.user.userId;
      await this.proposalService.checkProposalOwnership(proposalId, userId);

      const regeneratedContent =
        await this.proposalService.regenerateSectionContent(sectionId, data);

      return { content: regeneratedContent };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to regenerate section: ${error.message}`,
      );
    }
  }
}
