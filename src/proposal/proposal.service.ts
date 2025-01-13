import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

export interface CreateProposalData {
  title: string;
  sections: {
    title: string;
    content: any;
    order: number;
  }[];
}

export interface GenerateProposalData {
  businessDescription: string;
  industry: string;
  targetAudience: string;
}

export interface GeneratedSection {
  title: string;
  content: string;
  order: number;
}

@Injectable()
export class ProposalService {
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async createProposal(userId: number, data: CreateProposalData) {
    try {
      return await this.prisma.proposal.create({
        data: {
          title: data.title,
          userId: userId,
          sections: {
            create: data.sections.map((section) => ({
              title: section.title,
              content: section.content,
              order: section.order,
            })),
          },
        },
        include: {
          sections: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to create proposal: ${error.message}`);
    }
  }

  async getUserProposals(userId: number) {
    try {
      return await this.prisma.proposal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          sections: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch user proposals: ${error.message}`);
    }
  }

  async checkProposalOwnership(proposalId: number, userId: number) {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        id: proposalId,
        userId: userId,
      },
    });

    if (!proposal) {
      throw new ForbiddenException('Access to proposal denied');
    }

    return proposal;
  }

  async getProposalWithSections(id: number) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!proposal) {
      throw new ForbiddenException('Proposal not found');
    }

    return proposal;
  }

  async updateProposalSections(
    proposalId: number,
    sections: { id?: number; title: string; content: any; order: number }[],
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const proposal = await tx.proposal.findUnique({
          where: { id: proposalId },
        });

        if (!proposal) {
          throw new ForbiddenException('Proposal not found');
        }

        // Save current version to history
        await tx.proposalHistory.create({
          data: {
            proposalId,
            version: proposal.version,
            content: { sections },
          },
        });

        // Increment version
        await tx.proposal.update({
          where: { id: proposalId },
          data: {
            version: { increment: 1 },
          },
        });

        // Update or create sections
        for (const section of sections) {
          if (section.id) {
            await tx.section.update({
              where: { id: section.id },
              data: {
                title: section.title,
                content: section.content,
                order: section.order,
              },
            });
          } else {
            await tx.section.create({
              data: {
                title: section.title,
                content: section.content,
                order: section.order,
                proposalId,
              },
            });
          }
        }

        // Return updated proposal with sections
        return tx.proposal.findUnique({
          where: { id: proposalId },
          include: {
            sections: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });
      });
    } catch (error) {
      throw new Error(`Failed to update proposal sections: ${error.message}`);
    }
  }

  async updateSectionOrder(
    proposalId: number,
    sectionUpdates: { id: number; order: number }[],
  ) {
    try {
      return await this.prisma.$transaction(
        sectionUpdates.map((update) =>
          this.prisma.section.update({
            where: { id: update.id },
            data: { order: update.order },
          }),
        ),
      );
    } catch (error) {
      throw new Error(`Failed to update section order: ${error.message}`);
    }
  }

  async getProposalVersion(proposalId: number, version: number) {
    try {
      const versionData = await this.prisma.proposalHistory.findFirst({
        where: {
          proposalId,
          version,
        },
      });

      if (!versionData) {
        throw new Error('Version not found');
      }

      return versionData;
    } catch (error) {
      throw new Error(`Failed to fetch proposal version: ${error.message}`);
    }
  }

  async saveAsTemplate(proposalId: number) {
    try {
      const proposal = await this.prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { sections: true },
      });

      if (!proposal) {
        throw new ForbiddenException('Proposal not found');
      }

      return await this.prisma.proposal.create({
        data: {
          title: `${proposal.title} (Template)`,
          userId: proposal.userId,
          isTemplate: true,
          sections: {
            create: proposal.sections.map((section) => ({
              title: section.title,
              content: section.content,
              order: section.order,
            })),
          },
        },
        include: {
          sections: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to save proposal as template: ${error.message}`);
    }
  }

  async generateInitialProposal(userId: number, data: GenerateProposalData) {
    const sectionTitles = [
      'Executive Summary',
      'Company Overview',
      'Solution',
      'Methodology',
      'Timeline',
      'Pricing',
      'Team',
      'Next Steps',
    ];

    try {
      const generatedSections = await Promise.all(
        sectionTitles.map(async (title, index) => {
          const prompt = this.createSectionPrompt(title, data);
          const content = await this.generateSectionContent(prompt);

          return {
            title,
            content,
            order: index,
          };
        }),
      );

      return await this.createProposal(userId, {
        title: `${data.industry} Proposal`,
        sections: generatedSections,
      });
    } catch (error) {
      throw new Error(`Failed to generate proposal: ${error.message}`);
    }
  }

  private createSectionPrompt(
    sectionTitle: string,
    data: GenerateProposalData,
  ): string {
    const baseContext = `You are writing a detailed business proposal section for a company in the ${data.industry} industry.

COMPANY CONTEXT:
${data.businessDescription}

TARGET AUDIENCE:
${data.targetAudience}

TASK:
Write the "${sectionTitle}" section of the business proposal. The content should be:
- Professional and business-appropriate
- Specific to the industry and target audience
- Formatted with appropriate headings and bullet points where relevant
- Between 300-500 words`;

    const sectionSpecificPrompts = {
      'Executive Summary': `${baseContext}
Focus on:
- Key value propositions and unique selling points
- Clear overview of the proposed solution
- Expected benefits and outcomes
- Brief mention of costs and timeline
Write this as a compelling summary that encourages further reading.`,

      'Company Overview': `${baseContext}
Include:
- Relevant company background and expertise
- Past successes and relevant experience in ${data.industry}
- Key differentiators from competitors
- Relevant certifications or partnerships`,

      Solution: `${baseContext}
Detail:
- Comprehensive description of the proposed solution
- How it specifically addresses the client's needs
- Key features and benefits
- Expected outcomes and deliverables
- Unique value proposition`,

      Methodology: `${baseContext}
Outline:
- Step-by-step approach to implementing the solution
- Project phases and key activities
- Quality assurance measures
- Risk management strategies
- Communication and reporting procedures`,

      Timeline: `${baseContext}
Create a detailed timeline including:
- Major project phases and milestones
- Specific deliverables for each phase
- Estimated duration for each phase
- Dependencies between different phases
- Key review and approval points`,

      Pricing: `${baseContext}
Provide:
- Clear breakdown of costs
- Payment schedule
- Optional add-ons or upgrades
- Terms and conditions
- Return on investment analysis`,

      Team: `${baseContext}
Describe:
- Key team members and their roles
- Relevant experience and qualifications
- Team structure and responsibility allocation
- Support and escalation procedures`,

      'Next Steps': `${baseContext}
Outline:
- Clear action items to move forward
- Required decisions or approvals
- Immediate next steps
- Timeline for getting started
- Contact information and availability`,
    };

    return sectionSpecificPrompts[sectionTitle] || baseContext;
  }

  async regenerateSectionContent(
    sectionId: number,
    data: {
      sectionTitle: string;
      currentContent: string;
      proposalTitle: string;
      sectionType: string;
      context: Array<{ title: string; content: string }>;
    },
  ) {
    try {
      // 1. Get the section
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
      });

      if (!section) {
        throw new Error('Section not found');
      }

      // 2. Create the prompt for regeneration
      const prompt = `You are regenerating a specific section of a business proposal.
  
  PROPOSAL TITLE: ${data.proposalTitle}
  SECTION TITLE: ${data.sectionTitle}
  SECTION TYPE: ${data.sectionType}
  
  CURRENT CONTENT:
  ${data.currentContent}
  
  CONTEXT (Other Sections):
  ${data.context.map((ctx) => `## ${ctx.title}\n${ctx.content}`).join('\n\n')}
  
  TASK:
  Regenerate the "${data.sectionTitle}" section while:
  - Maintaining professional business tone
  - Keeping the same general structure but improving clarity and impact
  - Ensuring content aligns with other sections
  - Including specific details from the current version
  - Adding more compelling arguments or examples where appropriate
  - Formatting with appropriate headings and bullet points where relevant
  - Keeping similar length to the current content
  
  Generate only the new content without any explanations or metadata.`;

      // 3. Generate new content using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional business proposal writer with expertise in creating compelling, clear, and well-structured proposal sections. Your responses should be detailed, professional, and directly relevant to the section being regenerated.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No content generated');
      }

      const regeneratedContent = completion.choices[0].message.content.trim();

      // 4. Update the section with new content
      await this.prisma.section.update({
        where: { id: sectionId },
        data: { content: regeneratedContent },
      });

      return regeneratedContent;
    } catch (error) {
      console.error('Error regenerating section content:', error);
      throw new Error(`Failed to regenerate section content: ${error.message}`);
    }
  }

  private async generateSectionContent(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional business proposal writer with expertise in creating compelling, clear, and well-structured proposal sections. Your responses should be detailed, professional, and directly relevant to the section being written.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No content generated');
      }

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }
}
