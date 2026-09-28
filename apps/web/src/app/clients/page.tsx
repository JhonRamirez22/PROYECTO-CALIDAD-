"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, ContactRound, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type ClientContact = { id: string; name: string; position?: string | null; email?: string | null; phone?: string | null; role: string; isPrimary: boolean };
type Client = {
  id: string;
  company: string;
  country: string;
  vatId: string;
  address: string;
  email: string | null;
  phone: string | null;
  status: string;
  contacts: ClientContact[];
  contracts?: { id: string; contractNumber: string; status: string; startDate: string; endDate?: string | null }[];
  _count: { orders: number };
};

const countries = ["Alemania", "Austria", "Bélgica", "Bulgaria", "Chipre", "Croacia", "Dinamarca", "Eslovaquia", "Eslovenia", "España", "Estonia", "Finlandia", "Francia", "Grecia", "Hungría", "Irlanda", "Italia", "Letonia", "Lituania", "Luxemburgo", "Malta", "Países Bajos", "Polonia", "Portugal", "República Checa", "Rumania", "Suecia"];
const vatPrefixes: Record<string, string> = { Alemania: "DE", Austria: "ATU", Bélgica: "BE", Bulgaria: "BG", Chipre: "CY", Croacia: "HR", Dinamarca: "DK", Eslovaquia: "SK", Eslovenia: "SI", España: "ES", Estonia: "EE", Finlandia: "FI", Francia: "FR", Grecia: "EL", Hungría: "HU", Irlanda: "IE", Italia: "IT", Letonia: "LV", Lituania: "LT", Luxemburgo: "LU", Malta: "MT", "Países Bajos": "NL", Polonia: "PL", Portugal: "PT", "República Checa": "CZ", Rumania: "RO", Suecia: "SE" };

const emptyClient = { company: "", country: "Alemania", vatId: "", address: "", email: "", phone: "" };
const emptyContact = { name: "", position: "", email: "", phone: "", role: "compras", isPrimary: false };
const emptyContract = { contractNumber: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", status: "ACTIVO" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [contactEditor, setContactEditor] = useState(false);
  const [contractEditor, setContractEditor] = useState(false);
  const [editingContactId, setEditingContactId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [clientForm, setClientForm] = useState(emptyClient);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [contractForm, setContractForm] = useState(emptyContract);

  const loadClients = async () => {
    setLoading(true);
    try {
      setClients(await api.get<Client[]>("/clients"));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el directorio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadClients(); }, []);

  const availableCountries = useMemo(() => [...new Set(clients.map((client) => client.country))].sort(), [clients]);
  const filtered = clients.filter((client) => {
    const searchMatch = `${client.company} ${client.vatId} ${client.email ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return searchMatch && (countryFilter === "ALL" || client.country === countryFilter);
  });
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;

  const createClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/clients", { ...clientForm, vatId: clientForm.vatId.toUpperCase().replace(/[\s.-]/g, "") });
      setClientForm(emptyClient);
      setShowCreate(false);
      setNotice("Cliente registrado; su VAT ID quedó validado por país.");
      await loadClients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo registrar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const openContactForm = (contact?: ClientContact) => {
    setEditingContactId(contact?.id ?? "");
    setContactForm(contact ? {
      name: contact.name,
      position: contact.position ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      role: contact.role,
      isPrimary: contact.isPrimary,
    } : emptyContact);
    setContactEditor(true);
  };

  const saveContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...contactForm, position: contactForm.position || undefined, email: contactForm.email || undefined, phone: contactForm.phone || undefined };
      if (editingContactId) await api.put(`/clients/contacts/${editingContactId}`, payload);
      else await api.post(`/clients/${selectedClient.id}/contacts`, payload);
      setContactEditor(false);
      setNotice(editingContactId ? "Contacto actualizado." : "Contacto añadido al cliente.");
      await loadClients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el contacto.");
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contact: ClientContact) => {
    if (!window.confirm(`¿Eliminar el contacto ${contact.name}?`)) return;
    try {
      await api.delete(`/clients/contacts/${contact.id}`);
      setNotice("Contacto eliminado.");
      await loadClients();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el contacto.");
    }
  };

  const saveContract = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient) return;
    setSaving(true); setError("");
    try {
      await api.post(`/clients/${selectedClient.id}/contracts`, {
        ...contractForm,
        contractNumber: contractForm.contractNumber.trim(),
        endDate: contractForm.endDate || undefined,
      });
      setContractForm(emptyContract); setContractEditor(false); setNotice("Contrato registrado."); await loadClients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el contrato.");
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Clientes europeos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Empresas, identificación VAT y contactos de operación.</p>
          </div>
          <Button onClick={() => setShowCreate((value) => !value)} className="gap-2"><Plus size={16} />Nuevo cliente</Button>
        </div>

        {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        {showCreate && <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="client-create-title">
          <div className="mb-4 flex items-start gap-3"><Building2 size={19} className="mt-0.5 text-primary" /><div><h3 id="client-create-title" className="font-semibold">Registrar cliente</h3><p className="mt-1 text-xs text-muted-foreground">El formato VAT se valida según el país seleccionado.</p></div></div>
          <form onSubmit={createClient} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="client-company">Empresa</Label><Input id="client-company" value={clientForm.company} onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="client-country">País de destino</Label><select id="client-country" value={clientForm.country} onChange={(event) => setClientForm({ ...clientForm, country: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="client-vat">VAT ID</Label><Input id="client-vat" value={clientForm.vatId} onChange={(event) => setClientForm({ ...clientForm, vatId: event.target.value.toUpperCase() })} placeholder={`${vatPrefixes[clientForm.country] ?? "XX"}…`} required aria-describedby="vat-help" /><p id="vat-help" className="text-[11px] text-muted-foreground">Prefijo esperado: {vatPrefixes[clientForm.country] ?? "país"}</p></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="client-address">Dirección</Label><Input id="client-address" value={clientForm.address} onChange={(event) => setClientForm({ ...clientForm, address: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="client-email">Correo de contacto</Label><Input id="client-email" type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="client-phone">Teléfono</Label><Input id="client-phone" value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} /></div>
            <div className="flex items-end gap-2"><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cliente"}</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></div>
          </form>
        </section>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(200px,1fr)_180px]">
              <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar clientes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Empresa, VAT o correo" className="h-9 pl-9 text-xs" /></label>
              <select aria-label="Filtrar por país" value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="ALL">Todos los países</option>{availableCountries.map((country) => <option key={country} value={country}>{country}</option>)}</select>
            </div>
            {loading ? <p className="p-5 text-sm text-muted-foreground">Cargando clientes…</p> : filtered.length === 0 ? <p className="p-12 text-center text-sm text-muted-foreground">No hay clientes que coincidan con esta búsqueda.</p> : (
              <div className="overflow-x-auto"><table className="ledger-table min-w-[600px] text-xs"><thead><tr><th>Empresa</th><th>Destino</th><th>VAT ID</th><th>Contactos</th><th>Pedidos</th></tr></thead><tbody>
                {filtered.map((client) => <tr key={client.id}>
                  <td><button type="button" onClick={() => { setSelectedClientId(client.id); setContactEditor(false); }} className={`text-left font-semibold hover:text-primary ${selectedClientId === client.id ? "text-primary" : "text-foreground"}`}>{client.company}</button><span className="mt-1 block text-[10px] text-muted-foreground">{client.email ?? "Sin correo principal"}</span></td>
                  <td>{client.country}</td><td className="font-mono">{client.vatId}</td><td>{client.contacts.length}</td><td>{client._count.orders}</td>
                </tr>)}
              </tbody></table></div>
            )}
          </section>

          <aside className="rounded-xl border border-border bg-card">
            {!selectedClient ? <div className="p-8 text-center"><ContactRound size={22} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Ficha de cliente</p><p className="mt-1 text-xs text-muted-foreground">Selecciona una empresa para revisar sus contactos.</p></div> : <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Ficha comercial</p><h3 className="mt-2 truncate text-base font-semibold">{selectedClient.company}</h3><p className="mt-1 text-xs text-muted-foreground">{selectedClient.country} · VAT {selectedClient.vatId}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openContactForm()} className="shrink-0 gap-1"><Plus size={14} />Contacto</Button><Button size="sm" variant="outline" onClick={() => setContractEditor((value) => !value)} className="shrink-0 gap-1"><Plus size={14} />Contrato</Button></div></div>
              <div className="p-5">
                {contractEditor && <form onSubmit={saveContract} className="mb-5 space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold">Contrato marco</p><button type="button" onClick={() => setContractEditor(false)} aria-label="Cerrar formulario de contrato"><X size={15} /></button></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="contract-number">Número o referencia</Label><Input id="contract-number" value={contractForm.contractNumber} onChange={(event) => setContractForm({ ...contractForm, contractNumber: event.target.value })} required /></div><div className="space-y-1"><Label htmlFor="contract-status">Estado</Label><select id="contract-status" value={contractForm.status} onChange={(event) => setContractForm({ ...contractForm, status: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="ACTIVO">Activo</option><option value="BORRADOR">Borrador</option></select></div><div className="space-y-1"><Label htmlFor="contract-start">Vigente desde</Label><Input id="contract-start" type="date" value={contractForm.startDate} onChange={(event) => setContractForm({ ...contractForm, startDate: event.target.value })} required /></div><div className="space-y-1"><Label htmlFor="contract-end">Vigente hasta (opcional)</Label><Input id="contract-end" type="date" value={contractForm.endDate} onChange={(event) => setContractForm({ ...contractForm, endDate: event.target.value })} /></div></div>
                  <Button size="sm" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar contrato"}</Button>
                </form>}
                <div className="mb-5 border-b border-border pb-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Contratos activos</p>{selectedClient.contracts?.filter((contract) => contract.status === "ACTIVO").length ? selectedClient.contracts.filter((contract) => contract.status === "ACTIVO").map((contract) => <p key={contract.id} className="mt-2 flex justify-between gap-2 text-xs"><span className="font-mono font-semibold">{contract.contractNumber}</span><span className="text-muted-foreground">hasta {contract.endDate ? new Date(contract.endDate).toLocaleDateString("es-CO") : "sin fecha"}</span></p>) : <p className="mt-2 text-xs text-warning">Sin contrato activo: no se podrán crear pedidos.</p>}</div>
                {contactEditor && <form onSubmit={saveContact} className="mb-5 space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold">{editingContactId ? "Editar contacto" : "Nuevo contacto"}</p><button type="button" onClick={() => setContactEditor(false)} aria-label="Cerrar formulario"><X size={15} /></button></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1"><Label htmlFor="contact-name">Nombre</Label><Input id="contact-name" value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} required /></div>
                    <div className="space-y-1"><Label htmlFor="contact-position">Cargo</Label><Input id="contact-position" value={contactForm.position} onChange={(event) => setContactForm({ ...contactForm, position: event.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="contact-email">Correo</Label><Input id="contact-email" type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="contact-phone">Teléfono</Label><Input id="contact-phone" value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="contact-role">Área</Label><select id="contact-role" value={contactForm.role} onChange={(event) => setContactForm({ ...contactForm, role: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="compras">Compras</option><option value="logistica">Logística</option><option value="pagos">Pagos</option></select></div>
                    <label className="flex items-center gap-2 self-end pb-2 text-xs"><input type="checkbox" checked={contactForm.isPrimary} onChange={(event) => setContactForm({ ...contactForm, isPrimary: event.target.checked })} />Contacto principal</label>
                  </div>
                  <Button size="sm" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar contacto"}</Button>
                </form>}
                <div className="space-y-3">
                  {selectedClient.contacts.length === 0 ? <p className="text-xs text-muted-foreground">No hay contactos registrados.</p> : selectedClient.contacts.map((contact) => <div key={contact.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0"><p className="truncate text-xs font-semibold">{contact.name}{contact.isPrimary && <span className="ml-2 status-pill state-ready">Principal</span>}</p><p className="mt-1 text-[10px] text-muted-foreground">{contact.position ?? contact.role} · {contact.email ?? "Sin correo"}</p>{contact.phone && <p className="mt-1 text-[10px] text-muted-foreground">{contact.phone}</p>}</div>
                    <div className="flex shrink-0 gap-1"><button type="button" onClick={() => openContactForm(contact)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Editar ${contact.name}`}><Edit3 size={14} /></button><button type="button" onClick={() => void deleteContact(contact)} className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-destructive" aria-label={`Eliminar ${contact.name}`}><Trash2 size={14} /></button></div>
                  </div>)}
                </div>
              </div>
            </>}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
