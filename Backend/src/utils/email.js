const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmail({ para, assunto, html }) {
  if (!process.env.EMAIL_USER) {
    console.log(`[EMAIL SIMULADO] Para: ${para} | Assunto: ${assunto}`);
    return;
  }
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      para,
    subject: assunto,
    html,
  });
}

function emailConfirmacaoConsulta(paciente, consulta, medico, especialidade) {
  const data = new Date(consulta.data_hora).toLocaleString('pt-AO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1565c0,#1e88e5);padding:32px 28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Hospital Vida Saudável</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Confirmação de Consulta</p>
      </div>
      <div style="padding:32px 28px;">
        <p style="font-size:16px;color:#1a2e4a;">Olá, <strong>${paciente.nome}</strong>!</p>
        <p style="color:#4a5568;">A sua consulta foi <strong style="color:#22c55e;">confirmada</strong> com sucesso.</p>
        <div style="background:#f7fafd;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #1565c0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Especialidade</td><td style="padding:6px 0;font-weight:600;color:#1a2e4a;">${especialidade}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Médico</td><td style="padding:6px 0;font-weight:600;color:#1a2e4a;">${medico}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Data e Hora</td><td style="padding:6px 0;font-weight:600;color:#1a2e4a;">${data}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Tipo</td><td style="padding:6px 0;font-weight:600;color:#1a2e4a;">${consulta.tipo === 'presencial' ? 'Presencial' : 'Online'}</td></tr>
          </table>
        </div>
        <p style="color:#4a5568;font-size:14px;">ℹ️ Cancelamento gratuito até 24 horas antes da consulta.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#718096;font-size:13px;text-align:center;">
          Hospital Vida Saudável · Av. 4 de Fevereiro, Nº 123, Luanda · +244 900 000 000
        </p>
      </div>
    </div>
  `;
}

module.exports = { enviarEmail, emailConfirmacaoConsulta };
