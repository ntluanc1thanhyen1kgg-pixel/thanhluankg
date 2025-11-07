// FIX: Replaced TabStopLeader with TabStopPosition in the import, as TabStopLeader is not an exported member.
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign, TabStopType, TabStopPosition } from 'docx';
import saveAs from 'file-saver';
import type { LessonPlan, Activity } from '../types';

const FONT_FAMILY = "Times New Roman";
const FONT_SIZE = 26; // 13pt * 2

// FIX: To resolve a TypeScript error ("'AlignmentType' refers to a value..."),
// TAlignmentType is derived from the enum's values using `typeof`. This gets the
// type of the enum object itself, which can then be correctly indexed.
type TAlignmentType = (typeof AlignmentType)[keyof typeof AlignmentType];

const createParagraph = (text: string, options: { bold?: boolean; isTitle?: boolean; alignment?: TAlignmentType } = {}) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: options.isTitle ? 32 : FONT_SIZE,
        bold: options.bold || options.isTitle,
      }),
    ],
    spacing: { after: 120 },
    alignment: options.alignment ?? AlignmentType.JUSTIFIED,
  });
};

const createRichParagraph = (
    parts: { text: string; bold?: boolean; italics?: boolean }[], 
    options: { alignment?: TAlignmentType; indent?: { firstLine?: number } } = {}
) => {
  const { alignment = AlignmentType.JUSTIFIED, indent } = options;
  return new Paragraph({
    children: parts.map(part => new TextRun({
        text: part.text,
        font: FONT_FAMILY,
        size: FONT_SIZE,
        bold: part.bold,
        italics: part.italics,
    })),
    spacing: { after: 120 },
    alignment: alignment,
    indent: indent,
  });
}

const createActivitiesCV1001 = (activities: Activity[], t: (key: string) => string): Table => {
    const cellMargins = { left: 100, right: 100, top: 80, bottom: 80 };
    const rows = [
        new TableRow({
            children: [
                new TableCell({
                    children: [createParagraph(t('docxTeacherActivity'), { bold: true, alignment: AlignmentType.LEFT })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: cellMargins,
                }),
                new TableCell({
                    children: [createParagraph(t('docxStudentActivity'), { bold: true, alignment: AlignmentType.LEFT })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: cellMargins,
                }),
            ],
            tableHeader: true,
        }),
    ];

    activities.forEach(activity => {
        rows.push(
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            createParagraph(activity.activityName, { bold: true, alignment: AlignmentType.LEFT }),
                            createRichParagraph([{ text: `${t('objective')} `, bold: true, italics: true }, { text: activity.objective, italics: true }]),
                        ],
                        columnSpan: 2,
                        margins: cellMargins,
                    }),
                ],
            })
        );
        
        const teacherActivityParas = (activity.teacherActivity || "").split('\n').map(line => new Paragraph({
            children: [new TextRun({ text: line, font: FONT_FAMILY, size: FONT_SIZE })],
            spacing: { after: 100 },
            alignment: AlignmentType.JUSTIFIED,
        }));

        const studentActivityParas = (activity.studentActivity || "").split('\n').map(line => new Paragraph({
            children: [new TextRun({ text: line, font: FONT_FAMILY, size: FONT_SIZE })],
            spacing: { after: 100 },
            alignment: AlignmentType.JUSTIFIED,
        }));

        rows.push(
            new TableRow({
                children: [
                    new TableCell({
                        children: [createParagraph(t('teachingMethod'), { bold: true, alignment: AlignmentType.LEFT }), ...teacherActivityParas],
                        verticalAlign: VerticalAlign.TOP,
                        margins: cellMargins,
                    }),
                     new TableCell({
                        children: [...studentActivityParas],
                        verticalAlign: VerticalAlign.TOP,
                        margins: cellMargins,
                    }),
                ],
            })
        );
    });

    return new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
    });
};

const createActivitiesCV5512 = (activities: Activity[], t: (key: string) => string): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    activities.forEach(activity => {
        paragraphs.push(createParagraph(activity.activityName, { bold: true }));
        paragraphs.push(createRichParagraph([{text: `${t('objective')} `, bold: true}, {text: activity.objective}]));
        paragraphs.push(createRichParagraph([{text: `${t('content')} `, bold: true}]));
        (activity.content || "").split('\n').forEach(line => paragraphs.push(createParagraph(line)));
        paragraphs.push(createRichParagraph([{text: `${t('product')} `, bold: true}]));
        (activity.product || "").split('\n').forEach(line => paragraphs.push(createParagraph(line)));
        paragraphs.push(createRichParagraph([{text: `${t('implementation')} `, bold: true}]));
        (activity.implementation || "").split('\n').forEach(line => paragraphs.push(createParagraph(line)));
    });
    return paragraphs;
};

export const exportToDocx = async (plans: LessonPlan[], t: (key: string) => string) => {
    const children: (Paragraph | Table)[] = [];
    const INDENT_FIRST_LINE = 720; // Corresponds to a 0.5-inch indent

    plans.forEach((plan, index) => {
        if (index > 0) {
            children.push(new Paragraph({ pageBreakBefore: true }));
        }
        
        const planTitle = plan.template === 'cv5512' ? t('teachingPlanTitle') : t('lessonPlanTitle');
        children.push(
          new Paragraph({
            text: `${planTitle} (${t('period')} ${index + 1})`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            style: "Title",
          }),
          createRichParagraph([
              {text: `${t('subject')}: `, bold: true}, {text: `${plan.subject}; `},
              {text: `${t('grade')}: `, bold: true}, {text: plan.grade},
          ], { alignment: AlignmentType.CENTER }),
          createRichParagraph([
              {text: `${t('lessonTitleLabel')}: `, bold: true}, {text: `${plan.lessonTitle}; `},
              {text: `${t('periods')}: `, bold: true}, {text: String(plan.periods)},
          ], { alignment: AlignmentType.CENTER }),
          createRichParagraph([{text: `${t('executionTime')}: `, bold: true}, {text: plan.executionTime}], { alignment: AlignmentType.CENTER }),
          createRichParagraph([{ text: t('docxDate'), italics: true }], { alignment: AlignmentType.CENTER }),
          
          new Paragraph({
            text: t('requiredOutcomes'),
            heading: HeadingLevel.HEADING_2,
            style: "Heading2",
            alignment: AlignmentType.JUSTIFIED,
          })
        );
        
        if(plan.template === 'cv5512' && plan.requiredOutcomes.knowledge) {
             children.push(createRichParagraph(
              [{text: `${t('knowledge')} `, bold: true}, {text: plan.requiredOutcomes.knowledge}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          ));
        }

        children.push(
             createRichParagraph(
              [{text: `${plan.template === 'cv5512' ? t('competencies') : t('generalCompetencies')} `, bold: true}, {text: plan.requiredOutcomes.generalCompetencies}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          )
        );

        if(plan.template !== 'cv5512') {
             children.push(createRichParagraph(
              [{text: `${t('specificCompetencies')} `, bold: true}, {text: plan.requiredOutcomes.specificCompetencies}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          ));
        }

        children.push(
            createRichParagraph(
              [{text: `${t('qualities')} `, bold: true}, {text: plan.requiredOutcomes.qualities}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          ));

        if(plan.requiredOutcomes.integratedContent) {
            children.push(createRichParagraph(
              [{text: `${t('integratedContent')} `, bold: true}, {text: plan.requiredOutcomes.integratedContent}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          ));
        }

        children.push(
          new Paragraph({
            text: t('teachingAids'),
            heading: HeadingLevel.HEADING_2,
            style: "Heading2",
            alignment: AlignmentType.JUSTIFIED,
          }),
          createRichParagraph(
              [{text: `${t('teacherAids')} `, bold: true}, {text: plan.teachingAids.teacher}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          ),
          createRichParagraph(
              [{text: `${t('studentAids')} `, bold: true}, {text: plan.teachingAids.student}],
              { indent: { firstLine: INDENT_FIRST_LINE } }
          ),
          
          new Paragraph({
            text: t('teachingActivities'),
            heading: HeadingLevel.HEADING_2,
            style: "Heading2",
            alignment: AlignmentType.JUSTIFIED,
          })
        );
        
        if (plan.template === 'cv5512') {
            children.push(...createActivitiesCV5512(plan.teachingActivities, t));
        } else {
            children.push(createActivitiesCV1001(plan.teachingActivities, t));
        }

        children.push(
          new Paragraph({
            text: t('postLessonAdjustments'),
            heading: HeadingLevel.HEADING_2,
            style: "Heading2",
            alignment: AlignmentType.JUSTIFIED,
          }),
          ...[...Array(3)].map(() => new Paragraph({
              children: [new TextRun("\t")],
              tabStops: [
                  {
                      type: TabStopType.RIGHT,
                      position: TabStopPosition.MAX,
                      leader: 'dot',
                  },
              ],
              spacing: { after: 360 },
          }))
        );
    });
    
  const doc = new Document({
    sections: [{ children }],
    styles: {
        paragraphStyles: [
            {
                id: "Title",
                name: "Title",
                basedOn: "Normal",
                next: "Normal",
                run: { font: FONT_FAMILY, size: 32, bold: true },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                run: { font: FONT_FAMILY, size: FONT_SIZE, bold: true },
            },
        ]
    }
  });

  const firstPlan = plans[0];
  const fileName = `${t('docxFilenamePrefix')}_${firstPlan.subject.replace(/\s/g, '_')}_${firstPlan.lessonTitle.replace(/\s/g, '_')}.docx`
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
};
