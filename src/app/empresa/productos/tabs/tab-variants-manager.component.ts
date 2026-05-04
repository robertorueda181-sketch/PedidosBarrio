import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs/operators';
import { LoaderComponent } from '../../../../shared/components/loader/loader';

interface VariantOption {
  id: string;
  name: string;
  values: string[];
  draftValue: string;
}

interface VariantGroup {
  groupKey: string;
  groupLabel: string;
  rowIndexes: number[];
}

export interface VariantFormValue {
  name: string;
  key: string;
  price: number;
  descripcion?: string;
  stock?: number;
}

export interface VariantOptionPayload {
  name: string;
  values: string[];
}

type VariantRowForm = FormGroup<{
  name: FormControl<string>;
  key: FormControl<string>;
  price: FormControl<number>;
  descripcion: FormControl<string>;
  stock: FormControl<number>;
}>;

@Component({
  selector: 'app-tab-variants-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    LoaderComponent
  ],
  templateUrl: './tab-variants-manager.component.html',
  styleUrl: './tab-variants-manager.component.css'
})
export class TabVariantsManagerComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);

  @Input() basePrice = 0;
  @Input() initialVariants: Array<Partial<VariantFormValue>> = [];
  @Input() initialOptionNames: string[] = [];
  @Output() variantsChange = new EventEmitter<VariantFormValue[]>();
  @Output() optionsChange = new EventEmitter<VariantOptionPayload[]>();
  @Output() groupByChange = new EventEmitter<number>();

  protected readonly maxOptions = 3;
  protected readonly isDownloadingTemplate = signal(false);
  protected readonly options = signal<VariantOption[]>([
    { id: crypto.randomUUID(), name: '', values: [], draftValue: '' }
  ]);
  protected readonly groupByOptionIndex = signal(0);
  private hasBootstrapped = false;
  private readonly rowsSnapshot = signal<VariantFormValue[]>([]);

  protected readonly combinations = computed(() => {
    const trimmedValueArrays = this.options()
      .map((option) => option.values.map((value) => value.trim()).filter(Boolean));

    if (!trimmedValueArrays.length || trimmedValueArrays.some((values) => values.length === 0)) {
      return [] as string[][];
    }

    return this.generateCombinations(trimmedValueArrays);
  });
  protected readonly pendingPricesCount = computed(() =>
    this.variantsArray.controls.filter((control) => Number(control.controls.price.value || 0) <= 0).length
  );
  protected readonly groupByOptions = computed(() =>
    this.options().map((option, index) => ({
      index,
      label: option.name.trim() || `Variante ${index + 1}`
    }))
  );
  protected readonly groupedRows = computed(() => {
    const snapshot = this.rowsSnapshot();
    if (!snapshot.length) {
      return [] as VariantGroup[];
    }

    const options = this.options();
    if (options.length <= 1) {
      const groupLabel = options[0]?.name.trim() || 'Variante';
      return [
        {
          groupKey: 'single-variant-group',
          groupLabel,
          rowIndexes: snapshot.map((_, rowIndex) => rowIndex)
        }
      ];
    }

    const groupsMap = new Map<string, VariantGroup>();
    const groupIndex = this.groupByOptionIndex();

    snapshot.forEach((variant, rowIndex) => {
      const parts = variant.name.split(' / ').map((part) => part.trim()).filter(Boolean);
      const groupLabel = parts[groupIndex] || 'Sin valor';
      const groupKey = `${groupIndex}:${groupLabel}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          groupKey,
          groupLabel,
          rowIndexes: []
        });
      }
      groupsMap.get(groupKey)!.rowIndexes.push(rowIndex);
    });

    return [...groupsMap.values()];
  });

  protected readonly variantsForm = this.fb.group({
    variants: this.fb.array<VariantRowForm>([])
  });

  constructor() {
    this.variantsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitVariants());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.hasBootstrapped && changes['initialVariants'] && this.initialVariants.length) {
      this.bootstrapFromInitialVariants();
      this.hasBootstrapped = true;
      return;
    }

    if (changes['basePrice'] && !changes['basePrice'].firstChange) {
      this.applyBasePriceToEmptyPrices();
    }
  }

  protected get variantsArray(): FormArray<VariantRowForm> {
    return this.variantsForm.controls.variants;
  }

  protected addOption(): void {
    if (this.options().length >= this.maxOptions) {
      return;
    }
    let nameOption = ''
    if(this.options().length === 1)
      nameOption = 'Color'
    else
      nameOption = `Opcion ${this.options().length + 1}`


    this.options.update((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: nameOption,
        values: [],
        draftValue: ''
      }
    ]);
    this.ensureValidGroupBySelection();
    this.emitOptions();
  }

  protected removeOption(optionId: string): void {
    this.options.update((current) => current.filter((option) => option.id !== optionId));
    this.ensureValidGroupBySelection();
    this.emitOptions();
    this.regenerateVariantRows();
  }

  protected updateOptionName(optionId: string, name: string): void {
    this.options.update((current) =>
      current.map((option) => option.id === optionId ? { ...option, name } : option)
    );
    this.emitOptions();
  }

  protected updateDraftValue(optionId: string, draftValue: string): void {
    this.options.update((current) =>
      current.map((option) => option.id === optionId ? { ...option, draftValue } : option)
    );
  }

  protected addOptionValue(optionId: string): void {
    const option = this.options().find((item) => item.id === optionId);
    const draft = option?.draftValue?.trim();
    if (!draft) {
      return;
    }
    const parsedValues = draft
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!parsedValues.length) {
      return;
    }

    this.options.update((current) =>
      current.map((item) => {
        if (item.id !== optionId) return item;
        const uniqueNewValues = parsedValues.filter((value) => !item.values.includes(value));
        return { ...item, values: [...item.values, ...uniqueNewValues], draftValue: '' };
      })
    );
    this.emitOptions();
    this.regenerateVariantRows();
  }

  protected removeOptionValue(optionId: string, value: string): void {
    this.options.update((current) =>
      current.map((option) =>
        option.id === optionId
          ? { ...option, values: option.values.filter((item) => item !== value) }
          : option
      )
    );
    this.emitOptions();
    this.regenerateVariantRows();
  }

  protected trackByOptionId(_: number, option: VariantOption): string {
    return option.id;
  }

  protected trackByVariantKey(index: number): string {
    return this.variantsArray.at(index).controls.key.value;
  }

  protected setGroupByIndex(rawValue: string): void {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }
    this.groupByOptionIndex.set(parsed);
    this.groupByChange.emit(parsed);
  }

  protected groupPrice(group: VariantGroup): number {
    if (!group.rowIndexes.length) {
      return 0;
    }
    const first = this.variantsArray.at(group.rowIndexes[0]).controls.price.value;
    const allSame = group.rowIndexes.every((rowIndex) => this.variantsArray.at(rowIndex).controls.price.value === first);
    return allSame ? Number(first || 0) : 0;
  }

  protected applyGroupPrice(group: VariantGroup, price: number | null | undefined): void {
    const normalized = Number(price || 0);
    group.rowIndexes.forEach((rowIndex) => {
      this.variantsArray.at(rowIndex).controls.price.setValue(normalized);
    });
  }

  protected downloadTemplate(): void {
    const url = 'https://localhost:7045/api/Presentaciones/descargar-plantilla';
    this.isDownloadingTemplate.set(true);

    this.http.get(url, { observe: 'response', responseType: 'blob' })
      .pipe(finalize(() => this.isDownloadingTemplate.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const blob = response.body;
          if (!blob) {
            return;
          }

          const contentDisposition = response.headers.get('content-disposition') ?? '';
          const match = /filename\*?=(?:UTF-8''|")?([^\";\n]+)"?/i.exec(contentDisposition);
          const fileName = match?.[1] ? decodeURIComponent(match[1]) : 'plantilla-presentaciones.xlsx';

          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = fileName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(objectUrl);
        },
        error: (err) => {
          console.error('Error descargando plantilla', err);
        }
      });
  }

  private bootstrapFromInitialVariants(): void {
    const parsed = this.initialVariants
      .map((variant) => ({
        name: String(variant.name ?? '').trim(),
        key: String(variant.key ?? variant.name ?? '').trim(),
        price: Number(variant.price ?? this.basePrice ?? 0),
        descripcion: variant.descripcion ?? '',
        stock: Number(variant.stock ?? 0),
      }))
      .filter((variant) => variant.name.length > 0);

    if (!parsed.length) {
      return;
    }

    const valueSets: string[][] = [];
    parsed.forEach((variant) => {
      const chunks = variant.name.split(' / ').map((chunk) => chunk.trim()).filter(Boolean);
      chunks.forEach((chunk, idx) => {
        if (!valueSets[idx]) {
          valueSets[idx] = [];
        }
        if (!valueSets[idx].includes(chunk)) {
          valueSets[idx].push(chunk);
        }
      });
    });

    this.options.set(
      valueSets.slice(0, this.maxOptions).map((values, index) => ({
        id: crypto.randomUUID(),
        name: `Opcion ${index + 1}`,
        values,
        draftValue: ''
      }))
    );
    this.ensureValidGroupBySelection();
    this.emitOptions();

    const formRows = parsed.map((variant) => this.createVariantRow(variant));
    this.replaceVariantRows(formRows);
    this.emitVariants();
  }

  private regenerateVariantRows(): void {
    const existingRows = this.variantsArray.controls.map((control) => control.getRawValue());
    const existingMap = new Map(existingRows.map((row) => [row.key, row]));

    const nextRows = this.combinations().map((chunks) => {
      const key = chunks.join('::');
      const name = chunks.join(' / ');
      const previous = existingMap.get(key)
        ?? this.initialVariants.find((item) => (item.key ?? item.name) === key || item.name === name);

      return this.createVariantRow({
        key,
        name,
        price: Number(previous?.price ?? 0),
        descripcion: previous?.descripcion ?? '',
        stock: Number(previous?.stock ?? 0),
      });
    });

    this.replaceVariantRows(nextRows);
    this.emitVariants();
  }

  private createVariantRow(row: VariantFormValue): VariantRowForm {
    return this.fb.group({
      name: this.fb.nonNullable.control(row.name),
      key: this.fb.nonNullable.control(row.key),
      price: this.fb.nonNullable.control(Number(row.price), { validators: [Validators.min(0)] }),
      descripcion: this.fb.nonNullable.control(row.descripcion ?? ''),
      stock: this.fb.nonNullable.control(Number(row.stock ?? 0), { validators: [Validators.min(0)] }),
    });
  }

  private replaceVariantRows(rows: VariantRowForm[]): void {
    while (this.variantsArray.length) {
      this.variantsArray.removeAt(this.variantsArray.length - 1, { emitEvent: false });
    }
    rows.forEach((row) => this.variantsArray.push(row, { emitEvent: false }));
  }

  private applyBasePriceToEmptyPrices(): void {
    // Intencionalmente no se pisan precios en variantes generadas.
    // El usuario debe completar precios manualmente para cada combinacion.
  }

  private emitVariants(): void {
    const payload = this.variantsArray.controls.map((control) => control.getRawValue());
    this.rowsSnapshot.set(payload);
    this.variantsChange.emit(payload);
  }

  private emitOptions(): void {
    const payload = this.options().map((option) => ({
      name: option.name.trim() || 'Variante',
      values: option.values.map((value) => value.trim()).filter(Boolean)
    }));
    this.optionsChange.emit(payload);
  }

  private generateCombinations(arrays: string[][]): string[][] {
    return arrays.reduce(
      (accumulator, currentArray) => accumulator.flatMap((prefix) => currentArray.map((value) => [...prefix, value])),
      [[]] as string[][]
    );
  }

  private ensureValidGroupBySelection(): void {
    const current = this.groupByOptionIndex();
    const optionsLength = this.options().length;
    if (optionsLength === 0) {
      this.groupByOptionIndex.set(0);
      if (current !== 0) {
        this.groupByChange.emit(0);
      }
      return;
    }
    if (current > optionsLength - 1) {
      this.groupByOptionIndex.set(0);
      this.groupByChange.emit(0);
    }
  }
}
