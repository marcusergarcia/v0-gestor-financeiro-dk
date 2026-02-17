"""
Valida o XML da NF-e contra o XSD REAL do PL_009_V4 da SEFAZ.
Baixa os schemas oficiais e reporta EXATAMENTE qual campo esta errado.
"""
import urllib.request
import os
import tempfile

# 1. Baixar os XSD oficiais do repositorio sped-nfe (PL_009_V4)
XSD_BASE = "https://raw.githubusercontent.com/nfephp-org/sped-nfe/master/schemes/PL_009_V4/"
XSD_FILES = [
    "enviNFe_v4.00.xsd",
    "leiauteNFe_v4.00.xsd",
    "tiposBasico_v4.00.xsd",
    "xmldsig-core-schema_v1.01.xsd",
    "nfe_v4.00.xsd",
]

tmpdir = tempfile.mkdtemp()
print(f"Baixando XSD files para {tmpdir}...")

for f in XSD_FILES:
    url = XSD_BASE + f
    dest = os.path.join(tmpdir, f)
    try:
        urllib.request.urlretrieve(url, dest)
        sz = os.path.getsize(dest)
        print(f"  OK: {f} ({sz} bytes)")
    except Exception as e:
        print(f"  ERRO ao baixar {f}: {e}")

# 2. XML EXATO dos logs (copiado do log completo)
XML_NFE = """<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
<idLote>1771309937120</idLote>
<indSinc>1</indSinc>
<NFe>
<infNFe Id="NFe35260249895742000111550010000001571670031507" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>67003150</cNF>
<natOp>Venda</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>157</nNF>
<dhEmi>2026-02-17T03:32:16-03:00</dhEmi>
<dhSaiEnt>2026-02-17T03:33:16-03:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>3550308</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>7</cDV>
<tpAmb>1</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>2</indPres>
<procEmi>0</procEmi>
<verProc>GestorFinanceiro 1.0</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>Macintel Seguranca Eletronica e Controle de Acesso Unipessoal LTDA</xNome>
<xFant>Macintel Seguranca Eletronica e Controle de Acesso</xFant>
<enderEmit>
<xLgr>Rua Luis Noberto Freire,</xLgr>
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
<CNPJ>05341743000149</CNPJ>
<xNome>MARCUS EMERSON ROCHA GARCIA - ME</xNome>
<enderDest>
<xLgr>RUA TAGUATO, 34</xLgr>
<nro>S/N</nro>
<xBairro>VILA FERNANDES</xBairro>
<cMun>3550308</cMun>
<xMun>SAO PAULO</xMun>
<UF>SP</UF>
<CEP>03433060</CEP>
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
</enderDest>
<indIEDest>9</indIEDest>
<email>marcus.macintel@terra.com.br</email>
</dest>
<det nItem="1">
<prod>
<cProd>001CTD006</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>TAG PASSIVO ADESIVO RFID UHF - CONTROL ID</xProd>
<NCM>85235210</NCM>
<CFOP>5102</CFOP>
<uCom>PC</uCom>
<qCom>1.0000</qCom>
<vUnCom>11.7000000000</vUnCom>
<vProd>11.70</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>PC</uTrib>
<qTrib>1.0000</qTrib>
<vUnTrib>11.7000000000</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<vTotTrib>3.68</vTotTrib>
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
<vProd>11.70</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>11.70</vNF>
<vTotTrib>3.68</vTotTrib>
</ICMSTot>
</total>
<transp>
<modFrete>9</modFrete>
</transp>
<pag>
<detPag>
<indPag>0</indPag>
<tPag>99</tPag>
<vPag>11.70</vPag>
</detPag>
</pag>
<infAdic>
<infCpl>DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.</infCpl>
</infAdic>
</infNFe>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
<SignedInfo>
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<Reference URI="#NFe35260249895742000111550010000001571670031507">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<DigestValue>AAAA</DigestValue>
</Reference>
</SignedInfo>
<SignatureValue>BBBB</SignatureValue>
<KeyInfo>
<X509Data>
<X509Certificate>CCCC</X509Certificate>
</X509Data>
</KeyInfo>
</Signature>
</NFe>
</enviNFe>"""

# 3. Validar com lxml
try:
    from lxml import etree
    print("\nlxml disponivel! Validando contra XSD real...")
    
    # Parse o XSD principal (enviNFe)
    xsd_path = os.path.join(tmpdir, "enviNFe_v4.00.xsd")
    if os.path.exists(xsd_path):
        with open(xsd_path, 'rb') as f:
            xsd_doc = etree.parse(f)
        
        # Criar schema com resolver de includes/imports
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
        
        # Parse e validar o XML
        xml_doc = etree.fromstring(XML_NFE.encode('utf-8'))
        
        is_valid = schema.validate(xml_doc)
        
        if is_valid:
            print("\n=== XML VALIDO! O schema aceita este XML. ===")
            print("O problema pode estar na Signature ou no SOAP envelope.")
        else:
            print(f"\n=== XML INVALIDO! {len(schema.error_log)} erro(s) encontrado(s): ===")
            for i, error in enumerate(schema.error_log):
                print(f"\nERRO {i+1}:")
                print(f"  Linha: {error.line}")
                print(f"  Coluna: {error.column}")
                print(f"  Mensagem: {error.message}")
                print(f"  Dominio: {error.domain_name}")
                print(f"  Tipo: {error.type_name}")
                print(f"  Nivel: {error.level_name}")
    else:
        print(f"ERRO: XSD nao encontrado em {xsd_path}")
        
except ImportError:
    print("\nlxml NAO disponivel. Instalando...")
    import subprocess
    subprocess.check_call(["pip", "install", "lxml"])
    print("lxml instalado. Executando validacao...")
    
    from lxml import etree
    
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
    
    xml_doc = etree.fromstring(XML_NFE.encode('utf-8'))
    
    is_valid = schema.validate(xml_doc)
    
    if is_valid:
        print("\n=== XML VALIDO! ===")
    else:
        print(f"\n=== XML INVALIDO! {len(schema.error_log)} erro(s): ===")
        for i, error in enumerate(schema.error_log):
            print(f"\nERRO {i+1}:")
            print(f"  Linha: {error.line}")
            print(f"  Coluna: {error.column}")  
            print(f"  Mensagem: {error.message}")
            print(f"  Tipo: {error.type_name}")

# Cleanup
import shutil
shutil.rmtree(tmpdir, ignore_errors=True)
