"""
Valida o enviNFe COMPLETO (com Signature) contra o XSD oficial PL_009_V4.
Usa o XML EXATO dos logs do Vercel de 2026-02-17.
"""
import urllib.request
import os
import tempfile
import subprocess
import sys

# Instalar lxml se necessario
try:
    from lxml import etree
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "lxml", "-q"])
    from lxml import etree

# 1. Baixar XSD oficiais do PL_009_V4
XSD_BASE = "https://raw.githubusercontent.com/nfephp-org/sped-nfe/master/schemes/PL_009_V4/"
XSD_FILES = [
    "enviNFe_v4.00.xsd",
    "leiauteNFe_v4.00.xsd", 
    "tiposBasico_v4.00.xsd",
    "xmldsig-core-schema_v1.01.xsd",
    "nfe_v4.00.xsd",
]

tmpdir = tempfile.mkdtemp()
print(f"Baixando XSD para {tmpdir}...")
for f in XSD_FILES:
    url = XSD_BASE + f
    dest = os.path.join(tmpdir, f)
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  OK: {f} ({os.path.getsize(dest)} bytes)")
    except Exception as e:
        print(f"  ERRO: {f}: {e}")

# 2. XML EXATO copiado dos logs do Vercel de 17/02/2026 07:36
# Este e o enviNFe COMPLETO incluindo Signature (com valores fake para teste de schema)
XML_FULL = """<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
<idLote>1771313763028</idLote>
<indSinc>1</indSinc>
<NFe>
<infNFe Id="NFe35260249895742000111550010000001561268966281" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>26896628</cNF>
<natOp>Venda</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>156</nNF>
<dhEmi>2026-02-17T04:36:02-03:00</dhEmi>
<dhSaiEnt>2026-02-17T04:37:02-03:00</dhSaiEnt>
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
<procEmi>0</procEmi>
<verProc>GestorFinanceiro 1.0</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>Macintel Seguranca Eletronica e Controle de Acesso Unipe</xNome>
<xFant>Macintel Seguranca Eletronica e Controle de Acesso</xFant>
<enderEmit>
<xLgr>Rua Luis Noberto Freire</xLgr>
<nro>719</nro>
<xBairro>Jd Brasilia</xBairro>
<cMun>3550308</cMun>
<xMun>SAO PAULO</xMun>
<UF>SP</UF>
<CEP>03585150</CEP>
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
<fone>1141189314</fone>
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
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
<fone>1129109449</fone>
</enderDest>
<indIEDest>2</indIEDest>
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
<det nItem="2">
<prod>
<cProd>005FRD002</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>BATERIA ESTACIONARIA 12V 165AH DF2500 FREEDOM</xProd>
<NCM>85072010</NCM>
<CFOP>5102</CFOP>
<uCom>PC</uCom>
<qCom>2.0000</qCom>
<vUnCom>2719.0750000000</vUnCom>
<vProd>5438.15</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>PC</uTrib>
<qTrib>2.0000</qTrib>
<vUnTrib>2719.0750000000</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<vTotTrib>1710.30</vTotTrib>
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
<vProd>5628.01</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>5628.01</vNF>
<vTotTrib>1770.01</vTotTrib>
</ICMSTot>
</total>
<transp>
<modFrete>9</modFrete>
</transp>
<pag>
<detPag>
<indPag>0</indPag>
<tPag>99</tPag>
<xPag>Outros</xPag>
<vPag>5628.01</vPag>
</detPag>
</pag>
<infAdic>
<infCpl>BLOCO III - FORNECIMENTO REFERENTE O MATERIAL DE LUZ DE EMERGENCIA</infCpl>
</infAdic>
</infNFe>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<Reference URI="#NFe35260249895742000111550010000001561268966281">
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

# 3. Validar
print("\n--- Validacao 1: enviNFe COMPLETO contra enviNFe_v4.00.xsd ---")
xsd_path = os.path.join(tmpdir, "enviNFe_v4.00.xsd")

class SchemaResolver(etree.Resolver):
    def resolve(self, system_url, public_id, context):
        path = os.path.join(tmpdir, os.path.basename(system_url))
        if os.path.exists(path):
            return self.resolve_filename(path, context)
        return None

parser = etree.XMLParser()
parser.resolvers.add(SchemaResolver())

xsd_doc = etree.parse(xsd_path, parser)
schema = etree.XMLSchema(xsd_doc)

xml_doc = etree.fromstring(XML_FULL.encode('utf-8'))

is_valid = schema.validate(xml_doc)

if is_valid:
    print("=== RESULTADO: XML VALIDO contra enviNFe_v4.00.xsd ===")
else:
    print(f"=== RESULTADO: XML INVALIDO! {len(schema.error_log)} erro(s): ===")
    for i, error in enumerate(schema.error_log):
        print(f"\nERRO {i+1}:")
        print(f"  Linha: {error.line}, Coluna: {error.column}")
        print(f"  Mensagem: {error.message}")
        print(f"  Tipo: {error.type_name}")

# 4. Tambem validar contra nfe_v4.00.xsd (que define TNFe)
print("\n--- Validacao 2: enviNFe contra nfe_v4.00.xsd ---")
xsd_path2 = os.path.join(tmpdir, "nfe_v4.00.xsd")
xsd_doc2 = etree.parse(xsd_path2, parser)
try:
    schema2 = etree.XMLSchema(xsd_doc2)
    is_valid2 = schema2.validate(xml_doc)
    if is_valid2:
        print("=== RESULTADO: XML VALIDO contra nfe_v4.00.xsd ===")
    else:
        print(f"=== RESULTADO: XML INVALIDO! {len(schema2.error_log)} erro(s): ===")
        for i, error in enumerate(schema2.error_log):
            print(f"\nERRO {i+1}:")
            print(f"  Linha: {error.line}, Coluna: {error.column}")
            print(f"  Mensagem: {error.message}")
except Exception as e:
    print(f"Erro ao criar schema: {e}")

# 5. Validar contra leiauteNFe_v4.00.xsd
print("\n--- Validacao 3: enviNFe contra leiauteNFe_v4.00.xsd ---")
xsd_path3 = os.path.join(tmpdir, "leiauteNFe_v4.00.xsd")
xsd_doc3 = etree.parse(xsd_path3, parser)
try:
    schema3 = etree.XMLSchema(xsd_doc3)
    is_valid3 = schema3.validate(xml_doc)
    if is_valid3:
        print("=== RESULTADO: XML VALIDO contra leiauteNFe_v4.00.xsd ===")
    else:
        print(f"=== RESULTADO: XML INVALIDO! {len(schema3.error_log)} erro(s): ===")
        for i, error in enumerate(schema3.error_log):
            print(f"\nERRO {i+1}:")
            print(f"  Linha: {error.line}, Coluna: {error.column}")
            print(f"  Mensagem: {error.message}")
except Exception as e:
    print(f"Erro ao criar schema: {e}")

# 6. Teste sem <indPag> (caso o PL_009 original nao tenha)
print("\n--- Validacao 4: enviNFe SEM <indPag> ---")
XML_SEM_INDPAG = XML_FULL.replace("<indPag>0</indPag>\n", "")
xml_doc_sem = etree.fromstring(XML_SEM_INDPAG.encode('utf-8'))
is_valid4 = schema.validate(xml_doc_sem)
if is_valid4:
    print("=== RESULTADO: XML SEM indPag VALIDO! indPag pode ser o problema! ===")
else:
    print(f"=== RESULTADO: XML SEM indPag INVALIDO! {len(schema.error_log)} erro(s): ===")
    for i, error in enumerate(schema.error_log):
        print(f"  ERRO {i+1}: {error.message}")

# Cleanup
import shutil
shutil.rmtree(tmpdir, ignore_errors=True)
print("\n--- FIM ---")
