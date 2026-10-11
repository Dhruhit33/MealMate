package com.fooddelivery.notification_service.service;

import com.fooddelivery.notification_service.entity.NotificationLog;
import com.fooddelivery.notification_service.repository.NotificationLogRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final NotificationLogRepository logRepository;

    public void sendHtmlEmail(String to, String subject, String templateName,
                              Map<String, Object> variables, String eventType) {
        NotificationLog.NotificationLogBuilder logBuilder = NotificationLog.builder()
                .recipientEmail(to)
                .subject(subject)
                .eventType(eventType)
                .sentAt(LocalDateTime.now());
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlBody = templateEngine.process(templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);

            logRepository.save(logBuilder.status("SENT").build());
            log.info("Email sent to {} for event {}", to, eventType);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            logRepository.save(logBuilder.status("FAILED").errorMessage(e.getMessage()).build());
        }
    }
}
