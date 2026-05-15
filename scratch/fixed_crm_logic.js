    async function cargarClientes() {
      try {
        const res = await fetch('/clientes');
        let dataGlobal = await res.json();

        // FILTRADO ESTRICTO DE CARTERA (RBAC MULTI-TENANT)
        if (userData && userData.rol) {
          const rCrm = userData.rol.toLowerCase();
          if (['vendedor', 'asesor', 'administrativo', 'administrador', 'gerencia'].includes(rCrm)) {
            dataGlobal = dataGlobal.filter(c => {
              if (c.id_asesor_asignado && c.id_asesor_asignado.trim() !== '' && c.id_asesor_asignado !== 'null') {
                return c.id_asesor_asignado === userData.id_usuario;
              }
              return c.id_asesor === userData.id_usuario;
            });
          }
        }
        listaClientesGlobal = dataGlobal;
        filtrarClientes();
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        document.getElementById('tablaClientesBody').innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Error al cargar registros del CRM.</td></tr>`;
      }
    }

    function filtrarClientes() {
      const query = (document.getElementById('filtroNombre').value || '').toLowerCase();
      const etapaSel = document.getElementById('filtroEtapa').value;

      const filtrados = listaClientesGlobal.filter(c => {
        const nombreCompl = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.toLowerCase();
        const idStr = String(c.id_cliente);
        const matchesQuery = nombreCompl.includes(query) || idStr.includes(query);
        
        const etapaC = c.etapa || c.estatus || 'Prospecto nuevo';
        const matchesEtapa = !etapaSel || etapaC === etapaSel;

        return matchesQuery && matchesEtapa;
      });

      renderClientes(filtrados);
    }

    function renderClientes(lista) {
      const tbody = document.getElementById('tablaClientesBody');
      tbody.innerHTML = '';

      if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 40px;">No se encontraron clientes con los filtros aplicados.</td></tr>`;
        return;
      }

      lista.forEach(c => {
        const nomCompl = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.trim() || c.nombre || 'Sin Nombre';
        const inicial = nomCompl.charAt(0).toUpperCase();

        let avatarHtml = '';
        if (c.foto_cliente) {
          if (c.foto_cliente.includes('application/pdf')) {
            avatarHtml = `<a href="javascript:void(0)" onclick="descargarBlobBase64(listaClientesGlobal.find(i => i.id_cliente == '${c.id_cliente}').foto_cliente, 'Foto_Perfil.pdf')" style="width: 42px; height: 42px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; flex-shrink: 0; border: 2px solid #fca5a5; text-decoration: none; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" title="Descargar / Ver PDF">📄 PDF</a>`;
          } else {
            avatarHtml = `<img src="${c.foto_cliente}" alt="Avatar" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #c4b5fd; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">`;
          }
        } else {
          avatarHtml = `<div style="width: 42px; height: 42px; border-radius: 50%; background: #ede9fe; color: #570fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0; border: 2px solid #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">${inicial}</div>`;
        }

        const etapa = c.etapa || c.estatus || 'Prospecto nuevo';
        let colorEtapa = '#64748b'; // default
        if (etapa === 'Contactado') colorEtapa = '#3b82f6';
        if (etapa === 'Visitó terreno') colorEtapa = '#8b5cf6';
        if (etapa === 'Apartó') colorEtapa = '#f59e0b';
        if (etapa === 'Cliente activo') colorEtapa = '#10b981';
        if (etapa === 'En riesgo') colorEtapa = '#f43f5e';
        if (etapa === 'Moroso') colorEtapa = '#991b1b';
        if (etapa === 'Cancelado') colorEtapa = '#475569';
        if (etapa === 'Recuperado') colorEtapa = '#065f46';

        tbody.innerHTML += `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                ${avatarHtml}
                <div>
                  <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${nomCompl}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 2px;">ID CRM: #${c.id_cliente}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-weight: 600; color: #1e293b;">📞 ${c.telefono || 'Sin teléfono'}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${c.correo || c.email || 'Sin correo'}</div>
            </td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${c.colonia || c.municipio || 'Sin Asentamiento'}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${c.estado || 'Chiapas'}</div>
            </td>
            <td>
              <span style="background: ${colorEtapa}15; color: ${colorEtapa}; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 900; border: 1px solid ${colorEtapa}30; text-transform: uppercase; white-space: nowrap;">
                ${etapa}
              </span>
            </td>
            <td style="display: flex; gap: 6px; justify-content: center;">
              <button onclick="editarCliente('${c.id_cliente}')" style="padding: 6px 12px; border:none; background:#ede9fe; color:#570fff; border-radius:6px; cursor:pointer; font-size:12px; font-weight:800; transition:0.2s;" onmouseover="this.style.background='#d8b4fe'" onmouseout="this.style.background='#ede9fe'" title="Auditar / Modificar Ficha">✏️ Auditar</button>
              <button onclick="eliminarClienteLocal('${c.id_cliente}')" style="padding: 6px 12px; border:none; background:#fee2e2; color:#dc2626; border-radius:6px; cursor:pointer; font-size:12px; transition:0.2s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'" title="Eliminar / Inactivar">🗑️</button>
            </td>
          </tr>
        `;
      });
    }
