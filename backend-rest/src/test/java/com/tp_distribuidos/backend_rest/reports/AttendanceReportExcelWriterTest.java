package com.tp_distribuidos.backend_rest.reports;

import com.tp_distribuidos.backend_rest.enums.EventType;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AttendanceReportExcelWriterTest {

    private static final String[] HEADERS = {
            "Fecha", "Título", "Curador", "Inscriptos", "Cupo Máximo", "% Ocupación"
    };

    private final AttendanceReportExcelWriter writer = new AttendanceReportExcelWriter();

    @Test
    void createsOneSheetPerEventTypeWithHeaders() throws IOException {
        byte[] bytes = writer.write(Map.of());

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(EventType.values().length);
            for (EventType type : EventType.values()) {
                XSSFSheet sheet = workbook.getSheet(type.getDisplayName());
                assertThat(sheet).isNotNull();
                for (int column = 0; column < HEADERS.length; column++) {
                    assertThat(sheet.getRow(0).getCell(column).getStringCellValue()).isEqualTo(HEADERS[column]);
                }
                assertThat(sheet.getLastRowNum()).isEqualTo(0);
                assertThat(sheet.getPaneInformation()).isNotNull();
            }
        }
    }

    @Test
    void writesRowValuesIntoTheMatchingSheet() throws IOException {
        LocalDateTime date = LocalDateTime.of(2026, 5, 1, 10, 0);
        AttendanceReportRowDTO row = new AttendanceReportRowDTO(date, "Noche de Gala", "Ana Gomez", 4L, 10, 0.4);

        byte[] bytes = writer.write(Map.of(EventType.TALLER, List.of(row)));

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            XSSFSheet sheet = workbook.getSheet(EventType.TALLER.getDisplayName());
            assertThat(sheet.getLastRowNum()).isEqualTo(1);
            assertThat(sheet.getRow(1).getCell(0).getLocalDateTimeCellValue()).isEqualTo(date);
            assertThat(sheet.getRow(1).getCell(1).getStringCellValue()).isEqualTo("Noche de Gala");
            assertThat(sheet.getRow(1).getCell(2).getStringCellValue()).isEqualTo("Ana Gomez");
            assertThat(sheet.getRow(1).getCell(3).getNumericCellValue()).isEqualTo(4.0);
            assertThat(sheet.getRow(1).getCell(4).getNumericCellValue()).isEqualTo(10.0);
            assertThat(sheet.getRow(1).getCell(5).getNumericCellValue()).isEqualTo(0.4);

            XSSFSheet otherSheet = workbook.getSheet(EventType.VISITA_GUIADA.getDisplayName());
            assertThat(otherSheet.getLastRowNum()).isEqualTo(0);
        }
    }

    @Test
    void leavesDateAndMaxCapacityCellsEmptyWhenNull() throws IOException {
        AttendanceReportRowDTO row = new AttendanceReportRowDTO(null, "Noche de Gala", "Ana Gomez", 4L, null, 0.0);

        byte[] bytes = writer.write(Map.of(EventType.CHARLA, List.of(row)));

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            XSSFSheet sheet = workbook.getSheet(EventType.CHARLA.getDisplayName());
            assertThat(sheet.getRow(1).getCell(0)).isNull();
            assertThat(sheet.getRow(1).getCell(4)).isNull();
        }
    }

    @Test
    void writesMultipleRowsInOrder() throws IOException {
        LocalDateTime base = LocalDateTime.of(2026, 5, 1, 10, 0);
        AttendanceReportRowDTO first = new AttendanceReportRowDTO(base, "Primero", "Ana", 1L, 10, 0.1);
        AttendanceReportRowDTO second = new AttendanceReportRowDTO(base.plusDays(1), "Segundo", "Ana", 2L, 10, 0.2);

        byte[] bytes = writer.write(Map.of(EventType.EXPOSICION, List.of(first, second)));

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            XSSFSheet sheet = workbook.getSheet(EventType.EXPOSICION.getDisplayName());
            assertThat(sheet.getLastRowNum()).isEqualTo(2);
            assertThat(sheet.getRow(1).getCell(1).getStringCellValue()).isEqualTo("Primero");
            assertThat(sheet.getRow(2).getCell(1).getStringCellValue()).isEqualTo("Segundo");
        }
    }
}
