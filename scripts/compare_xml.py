"""
Comparacao elemento por elemento entre nosso XML e o XML autorizado do Contabilizei.
Identifica TODAS as diferencas estruturais.
"""
from xml.etree import ElementTree as ET

# XML autorizado do Contabilizei (NF-e 155) - apenas infNFe
XML_AUTORIZADO = """<infNFe xmlns="http://www.portalfiscal.inf.br/nfe" Id="NFe35260204989574200011155001000000155712522654" versao="4.00">
<ide>
<cUF>35</cUF><cNF>71252265</cNF><natOp>VENDA DE MERCADORIA</natOp><mod>55</mod><serie>1</serie><nNF>155</nNF>
<dhEmi>2026-02-14T08:15:00-03:00</dhEmi><dhSaiEnt>2026-02-14T08:15:00-03:00</dhSaiEnt>
<tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis>
<cDV>4</cDV><tpAmb>1</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>2</indPres>
<indIntermed>0</indIntermed><procEmi>0</procEmi><verProc>1.0</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>MACINTEL SEGURANCA ELETRONICA E CONTROLE DE ACESSO UNIPESSO</xNome>
<enderEmit>
<xLgr>RUA LUIS NORBERTO FREIRE</xLgr><nro>719</nro><xCpl>SALA 01</xCpl>
<xBairro>JARDIM BRASILIA (ZONA LESTE)</xBairro><cMun>3550308</cMun><xMun>Sao Paulo</xMun>
<UF>SP</UF><CEP>03585150</CEP>
</enderEmit>
<IE>149605942110</IE><CRT>1</CRT>
</emit>
<dest>
<CNPJ>50839883000100</CNPJ>
<xNome>MARCUS EMERSON ROCHA GARCIA</xNome>
<enderDest>
<xLgr>RUA TAGUATO</xLgr><nro>34</nro>
<xBairro>VILA FERNANDES</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun>
<UF>SP</UF><CEP>03433060</CEP>
</enderDest>
<indIEDest>9</indIEDest>
</dest>
<det nItem="1">
<prod>
<cProd>001</cProd><cEAN>SEM GTIN</cEAN>
<xProd>SERVICO DE INSTALACAO DE CAMERAS DE SEGURANCA</xProd>
<NCM>85258029</NCM><CFOP>5102</CFOP><uCom>SV</uCom><qCom>1</qCom><vUnCom>150</vUnCom>
<vProd>150.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>SV</uTrib><qTrib>1</qTrib>
<vUnTrib>150</vUnTrib><indTot>1</indTot>
</prod>
<imposto>
<ICMS><ICMSSN102><orig>0</orig><CSOSN>400</CSOSN></ICMSSN102></ICMS>
<PIS><PISNT><CST>07</CST></PISNT></PIS>
<COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS>
<IPI><cEnq>999</cEnq><IPINT><CST>53</CST></IPINT></IPI>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>
<vFCPUFDest>0.00</vFCPUFDest><vICMSUFDest>0.00</vICMSUFDest><vICMSUFRemet>0.00</vICMSUFRemet>
<vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet><vProd>150.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg>
<vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>150.00</vNF>
<vTotTrib>0.00</vTotTrib>
</ICMSTot>
</total>
<transp><modFrete>9</modFrete></transp>
<pag>
<detPag><tPag>99</tPag><xPag>Outros</xPag><vPag>150.00</vPag></detPag>
</pag>
<infAdic><infCpl>Documento emitido por ME ou EPP optante pelo Simples Nacional.</infCpl></infAdic>
</infNFe>"""

# Nosso XML baseado nos logs
XML_NOSSO = """<infNFe xmlns="http://www.portalfiscal.inf.br/nfe" Id="NFe35260249895742000111550010000001561375720250" versao="4.00">
<ide>
<cUF>35</cUF><cNF>37572025</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>156</nNF>
<dhEmi>2026-02-17T05:05:58-03:00</dhEmi><dhSaiEnt>2026-02-17T05:05:58-03:00</dhSaiEnt>
<tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis>
<cDV>0</cDV><tpAmb>1</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>2</indPres>
<indIntermed>0</indIntermed><procEmi>0</procEmi><verProc>GestorFinanceiro1.0</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>Macintel Seguranca Eletronica e Controle de Acesso Unipe</xNome>
<xFant>Macintel Seguranca Eletronica</xFant>
<enderEmit>
<xLgr>RUA LUIS NORBERTO FREIRE</xLgr><nro>719</nro><xCpl>SALA 01</xCpl>
<xBairro>JARDIM BRASILIA (ZONA LESTE)</xBairro><cMun>3550308</cMun><xMun>Sao Paulo</xMun>
<UF>SP</UF><CEP>03585150</CEP>
</enderEmit>
<IE>149605942110</IE><CRT>1</CRT>
</emit>
<dest>
<CNPJ>50839883000100</CNPJ>
<xNome>MARCUS EMERSON ROCHA GARCIA - ME</xNome>
<enderDest>
<xLgr>RUA TAGUATO, 34</xLgr><nro>S/N</nro>
<xBairro>VILA FERNANDES</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun>
<UF>SP</UF><CEP>03433060</CEP>
</enderDest>
<indIEDest>9</indIEDest>
</dest>
<det nItem="1">
<prod>
<cProd>001CTD0001</cProd><cEAN>SEM GTIN</cEAN>
<xProd>TAG PASSIVO ADESIVO RFID UHF - CONTROL ID</xProd>
<NCM>85235210</NCM><CFOP>5102</CFOP><uCom>PC</uCom><qCom>1.0000</qCom><vUnCom>11.7000000000</vUnCom>
<vProd>11.70</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>PC</uTrib><qTrib>1.0000</qTrib>
<vUnTrib>11.7000000000</vUnTrib><indTot>1</indTot>
</prod>
<imposto>
<ICMS><ICMSSN102><orig>0</orig><CSOSN>400</CSOSN></ICMSSN102></ICMS>
<PIS><PISNT><CST>07</CST></PISNT></PIS>
<COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>
<vFCPUFDest>0.00</vFCPUFDest><vICMSUFDest>0.00</vICMSUFDest><vICMSUFRemet>0.00</vICMSUFRemet>
<vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet><vProd>11.70</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg>
<vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>11.70</vNF>
<vTotTrib>0.00</vTotTrib>
</ICMSTot>
</total>
<transp><modFrete>9</modFrete></transp>
<pag>
<detPag><tPag>99</tPag><xPag>Outros</xPag><vPag>11.70</vPag></detPag>
</pag>
</infNFe>"""

ns = {"nfe": "http://www.portalfiscal.inf.br/nfe"}

def get_all_elements(xml_str, prefix=""):
    """Retorna dicionario com caminho->texto de todos elementos"""
    root = ET.fromstring(xml_str)
    result = {}
    _walk(root, "", result, ns)
    return result

def _walk(elem, path, result, ns):
    tag = elem.tag.replace("{http://www.portalfiscal.inf.br/nfe}", "")
    current_path = f"{path}/{tag}" if path else tag
    
    # Incluir atributos
    for k, v in elem.attrib.items():
        if not k.startswith("{"):
            result[f"{current_path}@{k}"] = v
    
    if elem.text and elem.text.strip():
        result[current_path] = elem.text.strip()
    
    child_counts = {}
    for child in elem:
        child_tag = child.tag.replace("{http://www.portalfiscal.inf.br/nfe}", "")
        idx = child_counts.get(child_tag, 0)
        child_counts[child_tag] = idx + 1
    
    child_counts2 = {}
    for child in elem:
        child_tag = child.tag.replace("{http://www.portalfiscal.inf.br/nfe}", "")
        idx = child_counts2.get(child_tag, 0)
        child_counts2[child_tag] = idx + 1
        if child_counts[child_tag] > 1:
            _walk(child, f"{current_path}/{child_tag}[{idx}]", result, ns)
        else:
            _walk(child, current_path, result, ns)

print("=" * 80)
print("COMPARACAO XML AUTORIZADO vs NOSSO XML")
print("=" * 80)

autorizado = get_all_elements(XML_AUTORIZADO)
nosso = get_all_elements(XML_NOSSO)

# Campos no autorizado mas NAO no nosso
print("\n--- CAMPOS NO AUTORIZADO que FALTAM no nosso ---")
for k, v in sorted(autorizado.items()):
    if k not in nosso:
        print(f"  FALTA: {k} = {v}")

# Campos no nosso mas NAO no autorizado
print("\n--- CAMPOS EXTRAS no nosso que NAO existem no autorizado ---")
for k, v in sorted(nosso.items()):
    if k not in autorizado:
        print(f"  EXTRA: {k} = {v}")

# Campos com valores diferentes
print("\n--- CAMPOS COM VALORES DIFERENTES ---")
for k in sorted(set(autorizado.keys()) & set(nosso.keys())):
    if autorizado[k] != nosso[k]:
        print(f"  DIFF: {k}")
        print(f"    AUTORIZADO: {autorizado[k]}")
        print(f"    NOSSO:      {nosso[k]}")

# Lista de elementos na ORDEM
print("\n--- ORDEM DOS ELEMENTOS (autorizado) ---")
root_a = ET.fromstring(XML_AUTORIZADO)
def print_order(elem, depth=0):
    tag = elem.tag.replace("{http://www.portalfiscal.inf.br/nfe}", "")
    attrs = " ".join(f'{k}="{v}"' for k, v in elem.attrib.items() if not k.startswith("{"))
    text = elem.text.strip() if elem.text and elem.text.strip() else ""
    print(f"  {'  ' * depth}{tag}" + (f" [{attrs}]" if attrs else "") + (f" = {text}" if text else ""))
    for child in elem:
        print_order(child, depth + 1)

print_order(root_a)

print("\n--- ORDEM DOS ELEMENTOS (nosso) ---")
root_n = ET.fromstring(XML_NOSSO)
print_order(root_n)
