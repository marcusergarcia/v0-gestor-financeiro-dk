"""
Valida o XML EXATO dos logs de 2026-02-17T08:06 APOS remocao de cPais/xPais/fone.
Compara com XML autorizado do Contabilizei para confirmar equivalencia estrutural.
"""
import urllib.request
import os
import tempfile
import subprocess
import sys

try:
    from lxml import etree
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "lxml", "-q"])
    from lxml import etree

# Baixar XSD
XSD_BASE = "https://raw.githubusercontent.com/nfephp-org/sped-nfe/master/schemes/PL_009_V4/"
XSD_FILES = [
    "enviNFe_v4.00.xsd",
    "leiauteNFe_v4.00.xsd", 
    "tiposBasico_v4.00.xsd",
    "xmldsig-core-schema_v1.01.xsd",
    "nfe_v4.00.xsd",
]

tmpdir = tempfile.mkdtemp()
print(f"Baixando XSD...")
for f in XSD_FILES:
    url = XSD_BASE + f
    dest = os.path.join(tmpdir, f)
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  OK: {f}")
    except Exception as e:
        print(f"  ERRO: {f}: {e}")

class SchemaResolver(etree.Resolver):
    def resolve(self, system_url, public_id, context):
        path = os.path.join(tmpdir, os.path.basename(system_url))
        if os.path.exists(path):
            return self.resolve_filename(path, context)
        return None

parser = etree.XMLParser()
parser.resolvers.add(SchemaResolver())
xsd_doc = etree.parse(os.path.join(tmpdir, "enviNFe_v4.00.xsd"), parser)
schema = etree.XMLSchema(xsd_doc)

# XML CORRIGIDO: SEM cPais, xPais, fone (igual ao XML autorizado do Contabilizei)
# COM indIntermed (que ja foi adicionado)
# SEM indPag (ja removido)
XML_CORRIGIDO = """<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
<idLote>1771315566144</idLote>
<indSinc>1</indSinc>
<NFe>
<infNFe Id="NFe35260249895742000111550010000001561790367521" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>79036752</cNF>
<natOp>Venda</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>156</nNF>
<dhEmi>2026-02-17T05:06:05-03:00</dhEmi>
<dhSaiEnt>2026-02-17T05:07:05-03:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>3550308</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>1</cDV>
<tpAmb>1</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>2</indPres>
<indIntermed>0</indIntermed>
<procEmi>0</procEmi>
<verProc>GestorFinanceiro 1.0</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>Macintel Seguranca Eletronica e Controle de Acesso Unipe</xNome>
<enderEmit>
<xLgr>Rua Luis Noberto Freire</xLgr>
<nro>719</nro>
<xBairro>Jd Brasilia</xBairro>
<cMun>3550308</cMun>
<xMun>SAO PAULO</xMun>
<UF>SP</UF>
<CEP>03585150</CEP>
</enderEmit>
<IE>138780412115</IE>
<CRT>1</CRT>
</emit>
<dest>
<CNPJ>60526803000106</CNPJ>
<xNome>PARQUE RES. SAPOPEMBA</xNome>
<enderDest>
<xLgr>Rua Cristovao Jaques 234</xLgr>
<nro>S/N</nro>
<xBairro>Vila Primavera</xBairro>
<cMun>3550308</cMun>
<xMun>Sao Paulo</xMun>
<UF>SP</UF>
<CEP>03390090</CEP>
</enderDest>
<indIEDest>9</indIEDest>
<email>parqueresidencialsapopemba@gmail.com</email>
</dest>
<det nItem="1">
<prod>
<cProd>013NAN001</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>AVIAMENTOS BUCHAS PARAFUSOS SUPORTES FIXADORES</xProd>
<NCM>62171000</NCM>
<CFOP>5102</CFOP>
<uCom>CX</uCom>
<qCom>1.0000</qCom>
<vUnCom>189.8600000000</vUnCom>
<vProd>189.86</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>CX</uTrib>
<qTrib>1.0000</qTrib>
<vUnTrib>189.8600000000</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<vTotTrib>59.71</vTotTrib>
<ICMS>
<ICMSSN102>
<orig>0</orig>
<CSOSN>102</CSOSN>
</ICMSSN102>
</ICMS>
<PIS>
<PISNT>
<CST>07</CST>
</PISNT>
</PIS>
<COFINS>
<COFINSNT>
<CST>07</CST>
</COFINSNT>
</COFINS>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC>
<vICMS>0.00</vICMS>
<vICMSDeson>0.00</vICMSDeson>
<vFCP>0.00</vFCP>
<vBCST>0.00</vBCST>
<vST>0.00</vST>
<vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet>
<vProd>189.86</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>189.86</vNF>
<vTotTrib>59.71</vTotTrib>
</ICMSTot>
</total>
<transp>
<modFrete>9</modFrete>
</transp>
<pag>
<detPag>
<tPag>99</tPag>
<xPag>Outros</xPag>
<vPag>189.86</vPag>
</detPag>
</pag>
</infNFe>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<Reference URI="#NFe35260249895742000111550010000001561790367521">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<DigestValue>dGVzdA==</DigestValue>
</Reference>
</SignedInfo>
<SignatureValue>dGVzdA==</SignatureValue>
<KeyInfo>
<X509Data>
<X509Certificate>dGVzdA==</X509Certificate>
</X509Data>
</KeyInfo>
</Signature>
</NFe>
</enviNFe>"""

# Validar XML CORRIGIDO
print("\n--- Validacao: XML CORRIGIDO (sem cPais/xPais/fone, com indIntermed, sem indPag) ---")
xml_doc = etree.fromstring(XML_CORRIGIDO.encode('utf-8'))
is_valid = schema.validate(xml_doc)

if is_valid:
    print("RESULTADO: XML VALIDO!")
else:
    print(f"RESULTADO: XML INVALIDO! {len(schema.error_log)} erro(s):")
    for i, error in enumerate(schema.error_log):
        print(f"  ERRO {i+1}: Linha {error.line}: {error.message}")

# Agora validar o XML ANTERIOR (COM cPais/xPais/fone para confirmar que era invalido)
print("\n--- Validacao: XML ANTERIOR (com cPais/xPais/fone) ---")
XML_ANTERIOR = XML_CORRIGIDO.replace(
    "<CEP>03585150</CEP>\n</enderEmit>",
    "<CEP>03585150</CEP>\n<cPais>1058</cPais>\n<xPais>BRASIL</xPais>\n<fone>1141189314</fone>\n</enderEmit>"
).replace(
    "<CEP>03390090</CEP>\n</enderDest>",
    "<CEP>03390090</CEP>\n<cPais>1058</cPais>\n<xPais>BRASIL</xPais>\n<fone>1129109449</fone>\n</enderDest>"
)
xml_doc_ant = etree.fromstring(XML_ANTERIOR.encode('utf-8'))
is_valid_ant = schema.validate(xml_doc_ant)

if is_valid_ant:
    print("RESULTADO: XML ANTERIOR tambem VALIDO (cPais/xPais/fone nao era o problema)")
else:
    print(f"RESULTADO: XML ANTERIOR INVALIDO! (confirma que cPais/xPais/fone causava o erro)")
    for i, error in enumerate(schema.error_log):
        print(f"  ERRO {i+1}: Linha {error.line}: {error.message}")

# Validar XML AUTORIZADO do Contabilizei (NF-e 155) como referencia
print("\n--- Validacao: XML AUTORIZADO Contabilizei (NF-e 155 como referencia) ---")
XML_CONTABILIZEI = """<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
<idLote>1</idLote>
<indSinc>1</indSinc>
<NFe>
<infNFe Id="NFe35260249895742000111550010000001551537622341" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>53762234</cNF>
<natOp>Venda</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>155</nNF>
<dhEmi>2026-02-10T22:23:01-03:00</dhEmi>
<dhSaiEnt>2026-02-10T22:24:01-03:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>3550308</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>1</cDV>
<tpAmb>1</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>2</indPres>
<indIntermed>0</indIntermed>
<procEmi>0</procEmi>
<verProc>E.CONTABILIZEI 1.1</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>MACINTEL SEGURANCA ELETRONICA E CONTROLE DE ACESSO UNIPESSO</xNome>
<enderEmit>
<xLgr>RUA LUIS NORBERTO FREIRE</xLgr>
<nro>719</nro>
<xCpl>SALA 01</xCpl>
<xBairro>JARDIM BRASILIA (ZONA LESTE)</xBairro>
<cMun>3550308</cMun>
<xMun>Sao Paulo</xMun>
<UF>SP</UF>
<CEP>03585150</CEP>
</enderEmit>
<IE>138780412115</IE>
<CRT>1</CRT>
</emit>
<dest>
<CNPJ>73386021000160</CNPJ>
<xNome>CONDOMINIO RESIDENCIAL PARQUE ECOLOGICO</xNome>
<enderDest>
<xLgr>Rua Professor Alves Pedroso</xLgr>
<nro>630</nro>
<xBairro>Cangaiba</xBairro>
<cMun>3550308</cMun>
<xMun>Sao Paulo</xMun>
<UF>SP</UF>
<CEP>03721010</CEP>
</enderDest>
<indIEDest>9</indIEDest>
<email>pqecologico@yahoo.com.br</email>
</dest>
<det nItem="1">
<prod>
<cProd>013NAN001</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>AVIAMENTOS BUCHAS PARAFUSOS SUPORTES FIXADORES COLA FITA ETC</xProd>
<NCM>62171000</NCM>
<CFOP>5102</CFOP>
<uCom>cx</uCom>
<qCom>1</qCom>
<vUnCom>150</vUnCom>
<vProd>150.00</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>cx</uTrib>
<qTrib>1</qTrib>
<vUnTrib>150</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<vTotTrib>47.17</vTotTrib>
<ICMS>
<ICMSSN102>
<orig>0</orig>
<CSOSN>102</CSOSN>
</ICMSSN102>
</ICMS>
<IPI>
<cEnq>999</cEnq>
<IPINT>
<CST>53</CST>
</IPINT>
</IPI>
<PIS>
<PISNT>
<CST>07</CST>
</PISNT>
</PIS>
<COFINS>
<COFINSNT>
<CST>07</CST>
</COFINSNT>
</COFINS>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC>
<vICMS>0.00</vICMS>
<vICMSDeson>0.00</vICMSDeson>
<vFCP>0.00</vFCP>
<vBCST>0.00</vBCST>
<vST>0.00</vST>
<vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet>
<vProd>150.00</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>150.00</vNF>
<vTotTrib>47.17</vTotTrib>
</ICMSTot>
</total>
<transp>
<modFrete>9</modFrete>
</transp>
<cobr>
<dup>
<nDup>001</nDup>
<dVenc>2026-03-12</dVenc>
<vDup>150.00</vDup>
</dup>
</cobr>
<pag>
<detPag>
<tPag>15</tPag>
<vPag>150.00</vPag>
</detPag>
</pag>
</infNFe>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<Reference URI="#NFe35260249895742000111550010000001551537622341">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<DigestValue>dGVzdA==</DigestValue>
</Reference>
</SignedInfo>
<SignatureValue>dGVzdA==</SignatureValue>
<KeyInfo>
<X509Data>
<X509Certificate>dGVzdA==</X509Certificate>
</X509Data>
</KeyInfo>
</Signature>
</NFe>
</enviNFe>"""

xml_doc_contab = etree.fromstring(XML_CONTABILIZEI.encode('utf-8'))
is_valid_contab = schema.validate(xml_doc_contab)

if is_valid_contab:
    print("RESULTADO: XML CONTABILIZEI VALIDO (referencia ok)")
else:
    print(f"RESULTADO: XML CONTABILIZEI INVALIDO! {len(schema.error_log)} erro(s):")
    for i, error in enumerate(schema.error_log):
        print(f"  ERRO {i+1}: Linha {error.line}: {error.message}")

import shutil
shutil.rmtree(tmpdir, ignore_errors=True)
print("\n--- FIM ---")
