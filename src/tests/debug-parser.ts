// HandParserのデバッグ

import { HandParser } from '../common/hand-parser';

function debugParser() {
  console.log('=== HandParser デバッグ ===');
  
  console.log('12m:', HandParser.parseHandString('12m').map(t => t.toString()));
  console.log('45m:', HandParser.parseHandString('45m').map(t => t.toString()));
  console.log('456s:', HandParser.parseHandString('456s').map(t => t.toString()));
  console.log('789p:', HandParser.parseHandString('789p').map(t => t.toString()));
  console.log('11z:', HandParser.parseHandString('11z').map(t => t.toString()));
  
  const all = [
    ...HandParser.parseHandString('12m'),
    ...HandParser.parseHandString('45m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  console.log('合計:', all.map(t => t.toString()).join(''), '(', all.length, '枚)');
}

debugParser();