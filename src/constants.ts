import { Machine, Department, User } from './types';

export const DEPARTMENTS: Department[] = ['Agro', 'Modular', 'Solid', 'Sofa', 'Other'];

export const MACHINES: Machine[] = [
  // Modular
  { id: 'm1', name: 'BEAM SAW NEW <br>SCM', department: 'Modular', image: 'https://vetta.com.vn/vnt_upload/product/01_2017/thumbs/600_SCM_beam_saw_sigma_impact_1_1.jpg' },
  { id: 'm2', name: 'BEAM SAW OLD <br>SELCO', department: 'Modular' },
  { id: 'm3', name: 'EDGE BAND NEW <br>JADE 340', department: 'Modular' },
  { id: 'm4', name: 'EDGE BAND OLD <br>JADE 340', department: 'Modular' },
  { id: 'm5', name: 'SKIPPER 100', department: 'Modular' },
  { id: 'm6', name: 'ROVER GOLD OLD', department: 'Modular' },
  { id: 'm7', name: 'ROVER GOLD NEW', department: 'Modular' },
  { id: 'm8', name: 'ROVER 22', department: 'Modular' },
  { id: 'm9', name: 'PROFILE EDGE BANDING MACHINE', department: 'Modular' },
  { id: 'm10', name: 'RAIL BORER NEW', department: 'Modular' },
  { id: 'm11', name: 'DOWEL MILLING AND CUTTING MACHINE', department: 'Modular' },
  { id: 'm12', name: 'MANUAL EDGE BANDER <br>JAI MODULAR', department: 'Modular' },
  { id: 'm13', name: 'CLAMPING MACHINE <br>COSMO', department: 'Modular' },
  { id: 'm14', name: 'TRIMMING MACHINE <br>SPEEDY', department: 'Modular' },
  { id: 'm15', name: 'OTHER', department: 'Modular' },
  
  // Agro (Example placeholders)
  { id: 'a1', name: 'TRACTOR HUB', department: 'Agro' },
  { id: 'a2', name: 'PLOUGH UNIT', department: 'Agro' },
  
  // Solid
  { id: 's1', name: 'WOOD CUTTER A', department: 'Solid' },
  { id: 's2', name: 'WOOD CUTTER B', department: 'Solid' },
  
  // Sofa
  { id: 'sf1', name: 'FABRIC SEAMER', department: 'Sofa' },
  { id: 'sf2', name: 'FOAM CUTTER', department: 'Sofa' },

  // Other
  { id: 'o1', name: 'OTHER', department: 'Other' },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin User', role: 'Admin' },
  { id: 'u2', name: 'Supervisor User', role: 'Supervisor' },
  { id: 'u3', name: 'Maintainer User', role: 'Maintainer' },
];

export const APP_THEME = {
  primary: '#D32F2F', // SINGER RED
  textOnPrimary: '#FFFFFF',
  secondary: '#FFFFFF',
  textSecondary: '#333333',
};
