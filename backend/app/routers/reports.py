from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from app.database import get_db
from app import models

router = APIRouter(tags=["reports"])


@router.get("/pdf")
def generate_pdf(db: Session = Depends(get_db)):
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#15803d'),
            spaceAfter=20,
        )
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#166534'),
            spaceAfter=10,
            spaceBefore=15,
        )
        normal = styles['Normal']

        story = []

        # Header
        story.append(Paragraph("Ferme+ — Rapport agricole", title_style))
        story.append(Paragraph(f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}", normal))
        story.append(Spacer(1, 20))

        # Analyses de sol
        story.append(Paragraph("1. Analyses de sol", section_style))
        soils = db.query(models.SoilAnalysis).order_by(models.SoilAnalysis.created_at.desc()).limit(20).all()
        if soils:
            soil_data = [['Parcelle', 'pH', 'N', 'P', 'K', 'Humidité', 'Recommandation']]
            for s in soils:
                rec = (s.recommendation or '')[:80] + '...' if len(s.recommendation or '') > 80 else (s.recommendation or '')
                soil_data.append([
                    s.parcelle_id,
                    f"{s.ph:.1f}",
                    f"{s.nitrogen:.1f}",
                    f"{s.phosphorus:.1f}",
                    f"{s.potassium:.1f}",
                    f"{s.humidity:.1f}%",
                    rec,
                ])
            soil_table = Table(soil_data, colWidths=[2*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.6*cm, 7*cm], repeatRows=1)
            soil_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dcfce7')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#166534')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ]))
            story.append(soil_table)
        else:
            story.append(Paragraph("Aucune analyse de sol enregistrée.", normal))

        # Météo
        story.append(Paragraph("2. Données météo", section_style))
        weather = db.query(models.WeatherData).order_by(models.WeatherData.fetched_at.desc()).limit(10).all()
        if weather:
            weather_data = [['Lieu', 'Temp.', 'Humidité', 'Vent', 'Pluie', 'Date']]
            for w in weather:
                weather_data.append([
                    w.location,
                    f"{w.temperature:.1f}°C",
                    f"{w.humidity:.1f}%",
                    f"{w.wind_speed:.1f} m/s",
                    f"{w.rainfall:.1f} mm",
                    w.fetched_at.strftime('%d/%m %H:%M') if w.fetched_at else '',
                ])
            weather_table = Table(weather_data, colWidths=[4*cm, 2*cm, 2.5*cm, 2.5*cm, 2.5*cm, 3*cm], repeatRows=1)
            weather_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ]))
            story.append(weather_table)
        else:
            story.append(Paragraph("Aucune donnée météo. Configurez OPENWEATHER_API_KEY.", normal))

        # IoT
        story.append(Paragraph("3. Données capteurs IoT (24h)", section_style))
        since = datetime.utcnow() - timedelta(hours=24)
        iot = db.query(models.IoTSensor).filter(models.IoTSensor.timestamp >= since).order_by(models.IoTSensor.timestamp.desc()).limit(20).all()
        if iot:
            iot_data = [['Parcelle', 'Capteur', 'Type', 'Valeur', 'Heure']]
            for i in iot:
                iot_data.append([
                    i.parcelle_id,
                    i.sensor_id,
                    i.sensor_type,
                    f"{i.value} {i.unit}",
                    i.timestamp.strftime('%d/%m %H:%M') if i.timestamp else '',
                ])
            iot_table = Table(iot_data, colWidths=[3*cm, 3*cm, 3*cm, 3*cm, 3*cm], repeatRows=1)
            iot_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3e8ff')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#7e22ce')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ]))
            story.append(iot_table)
        else:
            story.append(Paragraph("Aucune donnée IoT sur les 24 dernières heures.", normal))

        doc.build(story)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=fermeplus-rapport-{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
