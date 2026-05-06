const fs = require('fs');
const path = require('path');

const setupDbPath = path.join(__dirname, '..', 'src', 'config', 'setupDatabase.js');
const hospitaisJsPath = path.join(__dirname, '..', '..', 'Frontend', 'js', 'hospitais.js');

let setupDb = fs.readFileSync(setupDbPath, 'utf8');
let hospitaisJs = fs.readFileSync(hospitaisJsPath, 'utf8');

// 1. ADD NEW SPECIALTIES TO setupDatabase.js
const newSpecs = `
    ['Anemia Falciforme', 'Tratamento de Anemia Falciforme (centro de apoio)', 'fa-droplet', '#c62828'],
    ['Leucemias Agudas e Crónicas', 'Tratamento de leucemias', 'fa-vial-virus', '#d32f2f'],
    ['Linfomas', 'Tratamento de linfomas', 'fa-disease', '#b71c1c'],
    ['Hemofilia', 'Tratamento de hemofilia', 'fa-hand-dots', '#e53935'],
    ['Transplante de Medula Óssea', 'Centro de transplante de medula óssea', 'fa-bone', '#ff5252'],
    ['Psiquiatria Geral', 'Tratamento de esquizofrenia, transtornos bipolares e psicoses', 'fa-brain', '#6a1b9a'],
    ['Psicologia Clínica', 'Apoio psicoterapêutico e avaliações psicológicas', 'fa-head-side-virus', '#8e24aa'],
    ['Toxicodependência', 'Unidade dedicada ao tratamento de vícios e drogas pesadas', 'fa-pills', '#ab47bc'],
    ['Psiquiatria Infantil e Juvenil', 'Atendimento especializado para jovens com quadros de ansiedade e depressão', 'fa-child-reaching', '#9c27b0'],
    ['Fisioterapia Ocupacional', 'Reabilitação e terapia ocupacional', 'fa-hands-holding-child', '#7b1fa2'],
`;
if (!setupDb.includes('Anemia Falciforme')) {
  setupDb = setupDb.replace(
    `['Psiquiatria', 'Saúde mental e tratamento de transtornos psiquiátricos', 'fa-brain', '#6a1b9a'],`,
    `['Psiquiatria', 'Saúde mental e tratamento de transtornos psiquiátricos', 'fa-brain', '#6a1b9a'],${newSpecs}`
  );
}

// 2. ENRICH DESCRIPTIONS
const descriptions = {
  'Hospital Josina Machel (Maria Pia)': 'O maior complexo hospitalar de Angola, sendo a principal referência em cuidados médicos e cirúrgicos de alta complexidade, prestando serviços essenciais e formando gerações de profissionais médicos na capital.',
  'Hospital do Prenda': 'Unidade estratégica da rede de saúde, amplamente reconhecida pelo seu centro de traumas e referência em Cirurgia Geral, Ortopedia e prestação rápida de serviços de urgência para a zona sul.',
  'Hospital Américo Boavida': 'Importante centro hospitalar universitário que alia o atendimento médico ao ensino e investigação. A unidade encontra-se atualmente em fase de expansão e profunda modernização estrutural.',
  'Hospital Geral de Luanda (HGL)': 'Unidade moderna de grande porte localizada no Camama, vocacionada para o atendimento integrado da população com uma vasta gama de especialidades clínicas, cirúrgicas e cuidados intensivos.',
  'Hospital Materno Infantil Dr. Manuel Pedro Azancot de Menezes': 'Instituição de vanguarda desenhada para a excelência em cuidados da mulher e do recém-nascido, providenciando assistência avançada em neonatologia, ginecologia e acompanhamento pré-natal.',
  'Complexo de Doenças Cardio-Pulmonares Cardeal Dom Alexandre do Nascimento': 'Centro hospitalar de referência nacional e internacional com infraestruturas de altíssima tecnologia, especializado no diagnóstico e tratamento cirúrgico avançado de doenças cardiovasculares e pulmonares.',
  'Hospital Geral dos Cajueiros': 'Pilar fundamental de assistência médica no município do Cazenga, destacando-se no atendimento primário e especializado em pediatria, nutrição e serviços gerais, garantindo saúde a milhares de cidadãos.',
  'Hospital Geral de Cacuaco (Heróis de Kangamba)': 'Hospital moderno construído na Centralidade do Sequele para suprir as necessidades de Cacuaco, oferecendo não apenas urgências e clínica geral, mas operando também a vital unidade de Oncologia Pediátrica.',
  'Hospital Geral de Viana': 'Complexo sanitário de suporte primário e secundário focado no atendimento às enormes demandas demográficas de Viana, garantindo serviços ágeis em medicina interna, pediatria e ortopedia.',
  'Hospital Municipal de Viana': 'Unidade central para a resposta primária no município, focada no acolhimento rápido, urgências 24 horas e cuidados essenciais nas valências pediátricas e clínica geral, descongestionando as grandes urgências.',
  'Hospital Municipal do Sambizanga': 'Instituição essencial na malha urbana de Luanda, altamente empenhada no acompanhamento à maternidade, urgências pediátricas e cuidados materno-infantis para toda a zona envolvente.',
  'Instituto Oftalmológico de Angola': 'A principal unidade nacional inteiramente dedicada à saúde ocular, equipada com blocos operatórios modernos para cirurgias oftalmológicas de precisão e diagnóstico precoce de patologias da visão.',
  'Hospital Pediátrico David Bernardino': 'A maior e mais importante instituição do país voltada à saúde infantil, garantindo tratamento intensivo e multidisciplinar a crianças, desde a nefrologia pediátrica até ao acompanhamento intensivo.',
  'Hospital Especializado Neves Bendinha': 'Centro de referência internacional em cuidados a grandes queimados e cirurgia plástica reconstrutiva, contando com alas assépticas modernas para a recuperação crítica dos seus pacientes.',
  'Hospital Militar Principal / Instituto Superior': 'Instituição de rigor e excelência gerida pelas Forças Armadas, prestando cuidados especializados em traumatologia e cirurgias de grande complexidade tanto a militares como à população civil.',
  'Hospital Psiquiátrico de Luanda': 'A unidade central de saúde mental em Angola, dedicada ao apoio e reabilitação de utentes com transtornos do foro psicológico, através de intervenção clínica e terapias ocupacionais modernas.',
  'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo': 'Unidade de altíssima diferenciação dedicada ao diagnóstico e tratamento intensivo de doenças hematológicas infantis, pioneira no acompanhamento de anemias falciformes e neoplasias no sangue.'
};

const newHospitalSpecs = {
  'Hospital Psiquiátrico de Luanda': `['Psiquiatria Geral', 'Psicologia Clínica', 'Toxicodependência', 'Neurologia', 'Psiquiatria Infantil e Juvenil', 'Fisioterapia Ocupacional']`,
  'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo': `['Anemia Falciforme', 'Leucemias Agudas e Crónicas', 'Linfomas', 'Hemofilia', 'Transplante de Medula Óssea']`
};

// Replace descriptions in setupDatabase.js
for (const [nome, desc] of Object.entries(descriptions)) {
  const regex = new RegExp(`nome:\\s*'${nome.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}',[\\s\\S]*?descricao:\\s*'.*?'`, 'g');
  setupDb = setupDb.replace(regex, (match) => {
    return match.replace(/descricao:\s*'.*'/, `descricao: '${desc}'`);
  });
  
  const regexFb = new RegExp(`nome:\\s*'${nome.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}',[\\s\\S]*?descricao:\\s*'.*?'`, 'g');
  hospitaisJs = hospitaisJs.replace(regexFb, (match) => {
    return match.replace(/descricao:\s*'.*'/, `descricao: '${desc}'`);
  });
}

// Replace specialties in setupDatabase.js
for (const [nome, specs] of Object.entries(newHospitalSpecs)) {
  const regex = new RegExp(`nome:\\s*'${nome.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}',[\\s\\S]*?especialidades:\\s*\\[.*?\\]`, 'g');
  setupDb = setupDb.replace(regex, (match) => {
    return match.replace(/especialidades:\s*\[.*?\]/, `especialidades: ${specs}`);
  });
}

// In hospitais.js, the specs are objects. We need to add the IDs and correct colors. 
// For simplicity, we just rebuild the hospitais.js specs for those two hospitals.
const psiqSpecsJS = `[
      { id:36, nome:'Psiquiatria Geral', icone:'fa-brain', cor:'#6a1b9a' },
      { id:37, nome:'Psicologia Clínica', icone:'fa-head-side-virus', cor:'#8e24aa' },
      { id:38, nome:'Toxicodependência', icone:'fa-pills', cor:'#ab47bc' },
      { id:6, nome:'Neurologia', icone:'fa-brain', cor:'#7b1fa2' },
      { id:39, nome:'Psiquiatria Infantil e Juvenil', icone:'fa-child-reaching', cor:'#9c27b0' },
      { id:40, nome:'Fisioterapia Ocupacional', icone:'fa-hands-holding-child', cor:'#7b1fa2' }
    ]`;

const hemaSpecsJS = `[
      { id:41, nome:'Anemia Falciforme', icone:'fa-droplet', cor:'#c62828' },
      { id:42, nome:'Leucemias Agudas e Crónicas', icone:'fa-vial-virus', cor:'#d32f2f' },
      { id:43, nome:'Linfomas', icone:'fa-disease', cor:'#b71c1c' },
      { id:44, nome:'Hemofilia', icone:'fa-hand-dots', cor:'#e53935' },
      { id:45, nome:'Transplante de Medula Óssea', icone:'fa-bone', cor:'#ff5252' }
    ]`;

hospitaisJs = hospitaisJs.replace(
  /nome:\s*'Hospital Psiquiátrico de Luanda',[\s\S]*?especialidades:\s*\[[\s\S]*?\]/,
  (match) => match.replace(/especialidades:\s*\[[\s\S]*?\]/, `especialidades: ${psiqSpecsJS}`)
);

hospitaisJs = hospitaisJs.replace(
  /nome:\s*'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo',[\s\S]*?especialidades:\s*\[[\s\S]*?\]/,
  (match) => match.replace(/especialidades:\s*\[[\s\S]*?\]/, `especialidades: ${hemaSpecsJS}`)
);

fs.writeFileSync(setupDbPath, setupDb);
fs.writeFileSync(hospitaisJsPath, hospitaisJs);
console.log('Successfully updated descriptions and specialties.');
