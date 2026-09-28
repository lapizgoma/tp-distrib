package com.tp_distribuidos.backend_rest.reports;

import com.tp_distribuidos.backend_rest.enums.EventType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Renderiza el informe de asistencia en un libro Excel (una hoja por tipo de evento).
 *
 * <p>Este componente solo conoce la presentación: encabezados, estilos y estructura
 * de las hojas. No accede a la base de datos, por lo que puede probarse de forma
 * aislada.</p>
 */
@Component
public class AttendanceReportExcelWriter {

    private static final String[] HEADERS = {
            "Fecha", "Título", "Curador", "Inscriptos", "Cupo Máximo", "% Ocupación"
    };

    private static final int[] COLUMN_WIDTHS = {
            20, 45, 25, 12, 14, 14
    };

    private static final String DATE_FORMAT = "dd/mm/yyyy hh:mm";
    private static final String PERCENT_FORMAT = "0.00%";

    /**
     * Construye el archivo {@code .xlsx} a partir de las filas agrupadas por tipo de evento.
     *
     * @param eventsByType filas del informe indexadas por tipo de evento; puede no contener
     *                     entradas para algún tipo.
     * @return el contenido binario del archivo Excel.
     */
    public byte[] write(Map<EventType, List<AttendanceReportRowDTO>> eventsByType) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            XSSFCellStyle headerStyle = createHeaderStyle(workbook);
            XSSFCellStyle dateStyle = createDateStyle(workbook);
            XSSFCellStyle percentStyle = createPercentStyle(workbook);

            for (EventType eventType : EventType.values()) {
                XSSFSheet sheet = workbook.createSheet(eventType.getDisplayName());
                writeHeader(sheet, headerStyle);

                List<AttendanceReportRowDTO> rows = eventsByType.getOrDefault(eventType, List.of());
                int rowIndex = 1;
                for (AttendanceReportRowDTO row : rows) {
                    writeRow(sheet, rowIndex++, row, dateStyle, percentStyle);
                }

                setColumnWidths(sheet);
                sheet.createFreezePane(0, 1);
            }

            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo generar el informe de asistencia en Excel", ex);
        }
    }

    private void writeHeader(XSSFSheet sheet, XSSFCellStyle headerStyle) {
        XSSFRow row = sheet.createRow(0);
        for (int column = 0; column < HEADERS.length; column++) {
            XSSFCell cell = row.createCell(column);
            cell.setCellValue(HEADERS[column]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void writeRow(XSSFSheet sheet, int rowIndex, AttendanceReportRowDTO reportRow,
                          XSSFCellStyle dateStyle, XSSFCellStyle percentStyle) {
        XSSFRow row = sheet.createRow(rowIndex);

        if (reportRow.date() != null) {
            XSSFCell dateCell = row.createCell(0);
            dateCell.setCellValue(reportRow.date());
            dateCell.setCellStyle(dateStyle);
        }

        row.createCell(1).setCellValue(reportRow.title());
        row.createCell(2).setCellValue(reportRow.curator());
        row.createCell(3).setCellValue(reportRow.registered());

        if (reportRow.maxCapacity() != null) {
            row.createCell(4).setCellValue(reportRow.maxCapacity());
        }

        XSSFCell occupancyCell = row.createCell(5);
        occupancyCell.setCellValue(reportRow.occupancyRate());
        occupancyCell.setCellStyle(percentStyle);
    }

    private void setColumnWidths(XSSFSheet sheet) {
        for (int column = 0; column < COLUMN_WIDTHS.length; column++) {
            sheet.setColumnWidth(column, COLUMN_WIDTHS[column] * 256);
        }
    }

    private XSSFCellStyle createHeaderStyle(XSSFWorkbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);

        XSSFCellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private XSSFCellStyle createDateStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat(DATE_FORMAT));
        return style;
    }

    private XSSFCellStyle createPercentStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat(PERCENT_FORMAT));
        return style;
    }
}
